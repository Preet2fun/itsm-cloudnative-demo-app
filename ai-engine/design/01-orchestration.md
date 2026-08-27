# Pillar 1 — Orchestration

The Code half of `Agent = LLM + Code + Memory` (`00-pillars-overview.md`
§1) — the decision procedure that ties reasoning to action. Every example
below is SRE/Observability or Security.

## 1. The Decision-Making Loop: ReAct + CoALA's Planning Cycle

Every node in a multi-agent system runs the same underlying loop. CoALA
names it more precisely than plain ReAct: **Observation → Planning
(Proposal → Evaluation → Selection) → Execution**, recurring.

```
Observation ──▶ ┌─────────────────────────┐
                 │ Planning                │
                 │  ┌──────────┐  ┌──────┐ │
                 │  │ Proposal │─▶│ Eval │ │
                 │  └──────────┘  └───┬──┘ │
                 │        ▲            │    │
                 │        └────────────┘    │
                 └─────────────┬───────────┘
                                ▼
                          Selection ──▶ Execution ──▶ (new Observation)
```

- **Observation** — the current state: a tool result, a delegated task
  description, an incoming alert.
- **Proposal** — the LLM generates one or more candidate next actions
  (reasoning about the task, not yet committing).
- **Evaluation** — the LLM (or a cheaper heuristic) judges the candidates —
  this is where a node decides "do I have enough evidence yet, or do I need
  another tool call."
- **Selection** — one action is chosen.
- **Execution** — the action runs: a tool call (grounding, `03-tools.md`),
  a memory write (`02-memory.md`), or a hand-off to another node.

Already-mandated pieces of this loop, not new requirements:

| Concept | Already required by |
|---|---|
| The loop itself | `CLAUDE.md` §2.2's Agent Core Loop (Goal → Plan/Reason → Decide Next Action → Tool Call/Observe → Reflect/Update State) — same shape |
| Plan Mode (generate a plan, get approval, execute) | Autonomy Level L2 "Act with approval" (`design-considerations.md`) + `interrupt()` (`CLAUDE.md` §2.2) |
| State Management (track progress across steps) | Typed LangGraph `State` schema (`CLAUDE.md` §2.1 — "structured over freeform") |
| Conditional Branching (different paths based on results) | LangGraph conditional edges (`CLAUDE.md` §2.3) |

**Reasoning and Retrieval are CoALA's internal actions, and this pillar
owns both** — Proposal/Evaluation *is* reasoning; a node reading from
episodic or semantic memory mid-loop *is* retrieval. Learning (writing to
memory) and Grounding (calling a tool) are executed here but *owned* by
`02-memory.md` and `03-tools.md` respectively — this file is the loop that
decides when to do them, not the mechanics of how.

---

## 2. The Three Composable Patterns

Almost every production multi-agent system reduces to these three. They are
not alternatives — a real multi-agent system (§7) typically uses all three
**at once**.

| # | Pattern | What it does | Reference |
|---|---|---|---|
| 1 | **Supervisor + Workers** | A coordinator decomposes the task and delegates to specialists by tool call. The supervisor stays strategic; workers absorb the noise. | §3 |
| 2 | **Parallel Fan-Out / Fan-In** | Independent sub-questions run concurrently, then results collapse back into one synthesis step. | §4 |
| 3 | **Writer + Critic Loop** | A writer drafts; a critic reviews against a rubric and sends it back until it passes or a cap is hit. | §5 |

---

## 3. Pattern 1 — Supervisor + Workers

Delegation by tool call — isolated state, no direct handoff edges between
workers.

```
                 ┌────────────────────────┐
User request ──▶ │  Supervisor             │
                 │  (clean context)        │
                 └───────────┬─────────────┘
                    task()   │   ▲ summary
                 ┌───────────┼───────────┐
                 ▼           ▼           ▼
            ┌─────────┐ ┌─────────┐ ┌─────────┐
            │ Worker A│ │ Worker B│ │ Worker C│   each: isolated context
            └────┬────┘ └────┬────┘ └────┬────┘
                 └────────────┴───────────┘
                              ▼
                          Synthesis
```

### How delegation works

- **Supervisor delegates** by emitting a `task(description, subagent_type)`
  tool call — not a direct function call, a tool call the graph executes.
- **Worker runs isolated** — it sees only the task description, never the
  supervisor's message history.
- **Only a summary returns** — the worker's last message becomes the tool
  result the supervisor sees. Detail stays in the worker's own trace/files.
- **No back-edges** — workers can't call the supervisor. The `recursion_limit`
  is the backstop against runaway delegation (§8). **Example:** if
  `logs_analyst` can't find an anomaly, it can't "ask the supervisor a
  clarifying question" — there's no edge for that. It must resolve with what
  it has, returning an explicit "no anomaly found in the given window"
  rather than stalling the graph waiting on a call that doesn't exist.

**Delegation *is* context management.** The supervisor never drowns in raw
worker output — that's the whole point of the pattern.

### Defining a worker node

Every worker is a small, single-purpose ReAct loop
(`langgraph.prebuilt.create_react_agent`) wrapped in a node function that
returns only a summary to the supervisor — never its own message history.

**Skills are MCP tools, not ad hoc functions** (`intent-and-build-guide.md`
already mandates MCP as the standard tool interface) — a worker's tools
list should be scoped MCP tools. **A worker's system prompt is a versioned
artifact**, fetched from Langfuse prompt management (`CLAUDE.md` §3), not a
hardcoded string — shown inline below only to keep the example
self-contained.

```python
from langgraph.prebuilt import create_react_agent
from langgraph.types import Command
from typing import Literal

def make_worker_node(name: str, system_prompt: str, model, tools: list):
    agent = create_react_agent(model, tools, prompt=system_prompt)

    def worker_node(state) -> Command[Literal["supervisor"]]:
        result = agent.invoke(state)
        summary = result["messages"][-1].content  # only the summary returns
        return Command(
            goto="supervisor",
            update={"messages": [{"role": "tool", "name": name, "content": summary}]},
        )
    return worker_node

# logs_analyst: skills = ["mcp__observability__search_logs", "mcp__observability__tail_logs"]
logs_analyst = make_worker_node(
    "logs_analyst",
    system_prompt=LOGS_ANALYST_PROMPT,  # from Langfuse prompt management
    model=MODEL_A,
    tools=[search_logs_tool, tail_logs_tool],
)

# metrics_analyst: skills = ["mcp__observability__query_metrics"]
metrics_analyst = make_worker_node(
    "metrics_analyst",
    system_prompt=METRICS_ANALYST_PROMPT,
    model=MODEL_B,
    tools=[query_metrics_tool],
)
```

The supervisor itself is a node whose model decides which worker(s) to
route to next, expressed as a `Command`:

```python
def supervisor_node(state) -> Command[Literal["logs_analyst", "metrics_analyst", "writer", "__end__"]]:
    decision = SUPERVISOR_MODEL.invoke(state["messages"])  # picks next node, or done
    return Command(goto=decision.next_node)

builder = StateGraph(MessagesState)
builder.add_node("supervisor", supervisor_node)
builder.add_node("logs_analyst", logs_analyst)
builder.add_node("metrics_analyst", metrics_analyst)
builder.add_edge(START, "supervisor")
```

---

## 4. Pattern 2 — Parallel Fan-Out / Fan-In

Independent work runs concurrently — the supervisor emits multiple `task()`
calls in **one turn**.

```
                    ┌───────────────────────────┐
                    │ Supervisor                │
                    └─────────────┬──────────────┘
              task() × 3, single turn, run in parallel
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ logs_analyst    │ │ metrics_analyst│ │ deploy_analyst  │
└────────┬────────┘ └────────┬───────┘ └────────┬────────┘
         └───────────────────┴───────────────────┘
                              ▼
                         Synthesis
```

- **Concurrency** — the graph runs the `task()` calls in parallel; wall-clock
  ≈ the slowest worker, not the sum of all of them. This is the same idea as
  LangGraph's `Send` fan-out (`CLAUDE.md` §2.3) — the supervisor node just
  reaches it via multiple tool calls in one turn instead of an explicit
  `Send`.
- **Isolation** — each worker reads only its own evidence; the supervisor
  sees only short summaries.
- **Different models** — each worker runs on the model best suited to its
  job (§6), not whatever model the supervisor happens to be.

**Three specialists, three models, one turn. The supervisor's context stays
tiny.**

This is the literal LangGraph mechanism behind the parallel `task()` calls
described above — the supervisor node returns a list of `Send` objects
instead of one `Command`, and LangGraph runs each targeted node
concurrently.

```python
from langgraph.types import Send

def fan_out(state) -> list[Send]:
    return [
        Send("logs_analyst", {"messages": state["messages"]}),
        Send("metrics_analyst", {"messages": state["messages"]}),
        Send("deploy_analyst", {"messages": state["messages"]}),
    ]

builder.add_conditional_edges(
    "supervisor", fan_out, ["logs_analyst", "metrics_analyst", "deploy_analyst"]
)
```

### Cross-track: what fans out

| Track | Fan-out specialists (parallel) | Feeds into |
|---|---|---|
| **SRE** | `logs_analyst`, `metrics_analyst`, `deploy_analyst` | postmortem writer (§5) |
| **Security** | identity-access analyst, asset-criticality analyst, threat-intel analyst *(names per `04-evaluation.md` §2 worked example)* | incident-report writer |

---

## 5. Pattern 3 — Writer + Critic Loop (Control Flow)

Draft → review against a rubric → revise — until it passes or a cap is hit.

```
Findings ──▶ Writer ──▶ Critic
                ▲            │
                │ REVISE     │
                │ + notes    │
                └────────────┘
                             │ APPROVE
                             ▼
                    Final output (saved)
```

- **Writer drafts** from the fanned-in findings (§4).
- **Critic scores** against a **fixed rubric** — not vibes, not a fresh
  judgment call each round.
- **Conditional routing** — `APPROVE` ends the loop; anything else routes
  the critic's notes back to the writer.
- **Hard cap on rounds** — the loop always terminates, pass or not.

**An un-capped critic loop is the #1 multi-agent failure. Always bound it.**

**What the critic actually checks lives in `05-agent-skills.md`** — this
section is the graph shape only. Here's the wiring:

```python
def route_from_critic(state):
    if state["critic_verdict"].verdict == "APPROVE":
        return "save_output"
    if state["round"] >= MAX_ROUNDS:
        return "escalate_to_human"
    return "writer"

def escalate_to_human(state):
    decision = interrupt({
        "reason": "critic cap hit without APPROVE",
        "draft": state["draft"],
        "last_notes": state["critic_verdict"].notes,
    })
    return {"final_output": decision}

builder.add_node("writer", writer_node)
builder.add_node("critic", critic_node)  # defined in 05-agent-skills.md — what it checks, not how it's wired
builder.add_node("escalate_to_human", escalate_to_human)
builder.add_conditional_edges("critic", route_from_critic, {
    "save_output": "__end__",
    "escalate_to_human": "escalate_to_human",
    "writer": "writer",
})
```

**Cap-hit is a real graph node, not a comment.** `escalate_to_human` uses
LangGraph's `interrupt()` — the same primitive `CLAUDE.md` §2.2 already
requires for any autonomy-gated step — so a maxed-out loop pauses for a
human decision instead of silently shipping its last draft.

**Every hard cap bounds cost too, not just round count.** `MAX_ROUNDS`
alone doesn't stop one oversized round from ballooning in tokens — pair it
with a token/cost/wall-clock ceiling per run (OWASP LLM Top 10,
"Unbounded Consumption").

---

## 6. Right Model for the Job

A multi-agent system isn't one model called many times — it's the right
model per role. This repo's LLM provider is still TBD (`CLAUDE.md` §6,
P-Phase 8), so roles are described by capability, not brand:

| Role | Needs | Why |
|---|---|---|
| Supervisor + high-volume analyst | Model A — long context, strong orchestration, reliable tool-calling | Delegates constantly; a tool-calling failure here breaks the whole graph |
| Analytical/critic roles | Model B — sharp analytical and critique reasoning | Scores rubrics, correlates evidence |
| Writer | Model C — fast reasoning, used in a pure-text role | No tool-calling required, so raw reasoning speed matters more than tool reliability |
| Vision/multimodal worker | Model D — multimodal, reads images directly | The only role that needs to see a screenshot, not just read text |

**Not every model drives a tool-calling harness equally well.** A model
that reasons fast can still intermittently mangle complex tool-call
arguments — that's a reason to assign it the one pure-text role (the
writer), not a tool-heavy one. **Match the model to the role — including
whether it can actually drive your tool-calling harness** — verify this
empirically before assigning a tool-heavy role to any model you haven't
tested against this specific harness.

---

## 7. Composing All Three: The Full Multi-Agent System

One supervisor wiring every agent across several models: fan out to the
parallel analysts → hand findings to the writer → route the draft through
the critic → save the final output. All three patterns, composed.

```
                 ┌────────────────────────────┐
User: "write the │  Supervisor                 │
INC-4471         └──────────────┬───────────────┘
postmortem"          task() × 4, first turn, parallel
         ┌──────────────┬───────┴───────┬──────────────┐
         ▼              ▼               ▼              ▼
   logs_analyst   metrics_analyst  deploy_analyst  dashboard_analyst
         └──────────────┴───────┬───────┴──────────────┘
                          findings (files)
                                 ▼
                    writer ──REVISE + notes──▶ critic
                       ▲                          │
                       └──────────────────────────┘
                                 │ APPROVE
                                 ▼
                       Final postmortem saved
```

| Stage | What happens |
|---|---|
| **Fan-out** | 3–4 analysts, parallel (§4) |
| **Write** | Draft from findings (§5) |
| **Critic** | Review & finalize, capped rounds (§5) |

This exact composition is the concrete build of the "Postmortem drafting
agent" already named in `intent-and-build-guide.md` domain 3. The same
three-pattern composition equally implements a Security SOC
incident-report multi-agent system — swap the analysts (§4's cross-track
table) and the rubric (`05-agent-skills.md` §3), keep the shape.

---

## 8. Failure Mode: Runaway Loop

| Symptom | Fix |
|---|---|
| Agent delegates or retries forever; cost spirals | Hard `recursion_limit` + explicit round cap **and** a token/cost/wall-clock ceiling per run — round count alone doesn't bound one oversized round |

**Example:** `MAX_ROUNDS=3` passes fine if each round re-sends a 2k-token
draft, but if a bug makes the writer append the *entire* findings file to
every revision, 3 rounds can still balloon to hundreds of thousands of
tokens — the round cap alone never notices.

**Hitting the recursion limit isn't a retry signal — it's a bug signal.**
Set it deliberately (`CLAUDE.md` §2.2 — every loop needs an explicit
termination condition) and investigate when you hit it, don't just raise
the number.

---

## 9. Quick-Reference Checklist

- [ ] Pattern choice is deliberate — supervisor+workers, parallel fan-out,
      writer+critic, or a composition of the three (§2)
- [ ] Every worker node is a scoped `create_react_agent` with MCP tools and
      a Langfuse-versioned system prompt, not a hardcoded string (§3)
- [ ] Model picked per role by capability, not brand — tool-calling
      reliability verified empirically before a tool-heavy role (§6)
- [ ] Critic verdict is a schema-enforced structured output (not a string
      parsed by prefix), with `temperature=0` pinned — full definition in
      `05-agent-skills.md` §4 (§5)
- [ ] Every loop and delegation path has a hard cap — `recursion_limit` +
      round cap **and** a token/cost/wall-clock ceiling (§5, §8)
- [ ] Cap-hit routes to a real `interrupt()` node, not a log line (§5)
- [ ] Workers return summaries, not raw output; detail lives in memory —
      see `02-memory.md` (§3, §8)

---

## Reference index

- `00-pillars-overview.md` — the umbrella 5-pillar framework this doc is
  the full depth for (Pillar 1, Orchestration).
- `ai-engine/CLAUDE.md` §2.2–2.3 — the loop/graph engineering rules this
  doc implements (explicit termination, composable subgraphs, supervisor
  pattern, `Send` fan-out).
- `05-agent-skills.md` §3–§4 — what the critic checks and how the rubric is
  designed; this file only covers how it's wired into the graph.
- `intent-and-build-guide.md` §1, §3 — the SRE composable building blocks
  (`playbook-navigation`, `alerting-access`, `anomaly-detection`,
  `incident-insight`) and the "Postmortem drafting agent" this doc's
  running example instantiates. Those domain-1 agents can feed evidence
  into this system's analysts as tools; they are not the same agents as
  `logs_analyst`/`metrics_analyst`/`deploy_analyst` above.
- `design-considerations.md` — autonomy levels L0–L4; a node's own autonomy
  level still applies inside a multi-agent system.

### External industry sources

- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents)
  (HumanLayer), Factor 4 "Tools are just structured outputs" and Factor 7
  "Contact humans with tool calls" — back the schema-enforced critic
  verdict and `interrupt()`-based escalation (§5).
- OpenAI, ["A Practical Guide to Building
  Agents"](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
  — backs structured outputs generally (§5) and per-tool-call risk rating
  (see `03-tools.md`).
- arXiv 2606.26185, ["Temperature Control and Reproducibility in
  LLM-as-Judge"](https://arxiv.org/html/2606.26185) — backs "temp=0 is
  necessary, not sufficient" (§5).
- OWASP Top 10 for LLM Applications 2025, [LLM10 "Unbounded
  Consumption"](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf)
  — backs the token/cost/wall-clock cap (§8).
- AWS Well-Architected Framework,
  [REL_5](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.question.REL_5.en.html)
  — backs retry-with-backoff + circuit breaker (see `03-tools.md`).
- Anthropic engineering blog, ["When to use multi-agent systems, and when
  not
  to"](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
  — backs the pattern-choice guidance in §2.
