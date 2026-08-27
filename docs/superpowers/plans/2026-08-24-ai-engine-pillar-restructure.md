# AI Engine Design Folder — 5-Pillar / CoALA Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `ai-engine/design/evals-guidelines.md`,
`agent-internal-architecture-guidelines.md`, and
`agentic-system-pillars-guidelines.md` with six numbered, pillar-aligned
files, rewritten to be framework/vendor-agnostic (pure LangGraph, no
`deepagents`/"crew", no named models or named commercial products) and
grounded throughout in the CoALA cognitive-architecture framework.

**Architecture:** Six markdown files under `ai-engine/design/`, each owning
exactly one pillar (or the cross-pillar overview). Content is either
migrated verbatim from a still-present source file (old files are deleted
only in the final task, so every migration task can read its source
directly) or newly written per the exact prose specified in this plan. Every
cross-file reference uses the exact heading text declared in each task's
"Produces" block, so tasks executed independently (fresh subagent per task)
still produce mutually consistent cross-references.

**Tech Stack:** Markdown only. Code *examples inside* the docs are Python /
LangGraph (`StateGraph`, `langgraph.prebuilt.create_react_agent`, `Send`,
`interrupt`, `Command`, `Store`) — illustrative, not executed as part of
this plan.

**Spec:** `docs/superpowers/specs/2026-08-24-ai-engine-pillar-restructure-design.md`

## Global Constraints

- Vendor-agnostic: no named LLM model (no "MiniMax-M2.7", "DeepSeek-V3.2",
  "gpt-oss-120b", "gemma-4-31B-it"); no named commercial product used as
  evidence (no "Claude Code", "Cursor", "Devin", "Manus AI", "Open Deep
  Research" in a comparison/evidence table); no SambaNova/Data Science Dojo
  webinar citations, no `session_5`/`session_6` notebook paths.
- Framework-agnostic *except* the repo's already-fixed choices, which stay
  and are not genericized: **LangGraph** (exclusively, `ai-engine/CLAUDE.md`
  §3), **Langfuse** (exclusively, same §), **MCP** (the standard tool
  interface, `intent-and-build-guide.md`).
- No `deepagents` import or `create_deep_agent()` call anywhere. Use
  `langgraph.prebuilt.create_react_agent` (part of core LangGraph, not a
  separate framework) where a single-agent ReAct loop is needed inside a
  larger graph.
- The word "crew" does not appear anywhere in the final 6 files. Use
  "multi-agent system" (or "the graph" where grammatically cleaner).
- Every example illustrating a CoALA concept (memory writes, grounding,
  orchestration patterns) is SRE/Observability or Security — not ITSM — per
  the spec's §6 example-domain rule. ITSM examples are out of scope for
  these 6 files entirely.
- Do not delete `design-considerations.md`, `intent-and-build-guide.md`,
  `synthetic-rca-eval-design-considerations.md`, or
  `synthetic-rca-eval-build-blueprint.md` — they are out of scope, untouched.
- No task runs `git commit`. The user commits manually when ready
  (standing preference — do not run `git add`/`git commit` as part of any
  step in this plan).
- Every new/rewritten file ends with its own `## Reference index` section,
  matching the existing pattern in this folder (internal cross-references
  first, then an `### External industry sources` subsection for
  third-party citations).

---

### Task 1: `00-pillars-overview.md`

**Files:**
- Create: `ai-engine/design/00-pillars-overview.md`
- Read (source, do not modify): `ai-engine/design/agentic-system-pillars-guidelines.md`

**Interfaces:**
- Consumes: nothing (first file written; no dependency on other new files'
  exact content, only their filenames).
- Produces: file `00-pillars-overview.md` with headings, verbatim, in this
  order — later tasks that link back to this file use these exact anchors:
  `## 1. The Core Model: Agent = LLM + Code + Memory`,
  `## 2. The 5 Pillars`, `## 3. CoALA → Pillar Mapping`,
  `## 4. The 6-Step Build Journey` (with `### Step 1` … `### Step 6`
  subheadings, numbered exactly as below), `## 5. This Pattern Is
  Externally Validated`, `## 6. Quick-Reference Checklist`,
  `## Reference index`.

- [ ] **Step 1: Write `## 1. The Core Model: Agent = LLM + Code + Memory`**

This is fresh content, not migrated from the source file's intro (source
lines 1–21, including the "Source note" SambaNova/DSD webinar blockquote at
lines 15–19). **Do not carry that blockquote forward** — it's dropped per
Global Constraints. Full text:

```markdown
# Agentic AI System — 5 Pillars Overview

Component guideline #3 under `ai-engine/design/` — the umbrella framework
for the other five pillar files (`01-orchestration.md` through
`05-agent-skills.md`). Every example below is SRE/Observability or
Security, per `CLAUDE.md` §1's rule on examples.

## 1. The Core Model: Agent = LLM + Code + Memory

CoALA — "Cognitive Architectures for Language Agents" (Sumers et al.,
arXiv 2309.02427) — reduces every language agent to one equation:

**Agent = LLM + Code + Memory**

- **LLM** — the reasoning engine. Not retrained per task; the same
  pre-trained model reasons in natural language at every step.
- **Code** — the decision procedure. In this repo, that's a LangGraph
  graph: nodes, edges, and the loop that ties them together. This is
  Pillar 1, Orchestration (`01-orchestration.md`).
- **Memory** — what the agent remembers, in four distinct forms (working,
  episodic, semantic, procedural). This is Pillar 2, Memory
  (`02-memory.md`).

The other three pillars are refinements inside this equation, not separate
from it: Tools (`03-tools.md`) is how Code reaches outside itself —
CoALA calls this **grounding**. Evaluation (`04-evaluation.md`) is how you
verify the whole equation actually works. Agent Skills (`05-agent-skills.md`)
is the explicit, inspectable half of procedural memory — the part of "how
to do the task" that lives in a readable prompt or rubric rather than
opaque model weights.

Every agent built for SRE/Observability or Security in this repo is
designed against this equation, not assembled ad hoc.
```

- [ ] **Step 2: Write `## 2. The 5 Pillars`**

Full text:

```markdown
## 2. The 5 Pillars

| # | Pillar | What it covers | Full depth |
|---|---|---|---|
| 1 | **Orchestration** | The decision loop and multi-agent control flow | `01-orchestration.md` |
| 2 | **Memory** | What an agent remembers, and when it's allowed to write | `02-memory.md` |
| 3 | **Tools** | How an agent reaches outside itself (grounding) | `03-tools.md` |
| 4 | **Evaluation** | How you verify an agent actually works | `04-evaluation.md` |
| 5 | **Agent Skills** | Packaged, guardrailed, reusable behaviors | `05-agent-skills.md` |
```

- [ ] **Step 3: Write `## 3. CoALA → Pillar Mapping`**

Full text:

```markdown
## 3. CoALA → Pillar Mapping

CoALA organizes an agent into three categories — Memory, Action Space,
Decision-Making — that don't map one-to-one onto our 5 pillars. This table
is the explicit reconciliation, so nothing gets silently duplicated or
dropped between files:

| CoALA category | Our pillar | Where |
|---|---|---|
| Memory (working / episodic / semantic / procedural) | Memory | `02-memory.md` |
| Action Space — internal: Reasoning, Retrieval | Orchestration | `01-orchestration.md` |
| Action Space — internal: Learning (writes long-term memory) | Memory | `02-memory.md` |
| Action Space — external: Grounding | Tools | `03-tools.md` |
| Decision-Making (Observation → Proposal/Evaluation/Selection → Execution) | Orchestration | `01-orchestration.md` |
| Procedural memory, explicit half (skills, prompts, routines) | Agent Skills | `05-agent-skills.md` |
| *(no CoALA analog — our own addition)* | Evaluation | `04-evaluation.md` |

Evaluation is the one pillar without a direct CoALA category. CoALA is a
framework for *building* an agent's cognition; it doesn't cover how you
*verify* the result — that's ours to add, and `04-evaluation.md` does it.
```

- [ ] **Step 4: Write `## 4. The 6-Step Build Journey`**

Migrate from `agentic-system-pillars-guidelines.md` §7 (verified current
lines 230–325: the intro paragraph, the 6-step ASCII arrow diagram, and all
six `### Step N` subsections with their "Applied" callouts and the Step 3
red flags table — stop before §8 at line 326). Copy the content verbatim
with exactly these two changes throughout every step:

1. Replace every instance of "crew" with "multi-agent system" (e.g. "the
   SRE postmortem crew" → "the SRE incident-investigation multi-agent
   system"; "postmortem crew" → "incident-investigation system"). Check
   each occurrence in context — some read better as "the graph" (e.g. "the
   answer is composed (architecture doc §8)" stays structurally the same,
   just update the doc reference per Step 5 below).
2. Update every cross-reference from the old filenames/sections to the new
   ones:
   - `architecture doc §2` → `01-orchestration.md` §2 (its pattern-choice
     section — see Task 2)
   - `architecture doc §7` → `05-agent-skills.md` §3 (the rubric section,
     since rubric derivation is what Step 2 "Design the SOP" is
     illustrating — see Task 6)
   - `architecture doc §8` → `01-orchestration.md` §7 (the composed
     multi-agent system section — see Task 2)
   - `evals-guidelines.md Phase 1` → `04-evaluation.md` Phase 1 (same
     section number, new filename)
   - `evals-guidelines.md's testing pyramid and phased lifecycle (§3–§4
     there)` → `04-evaluation.md` §3–§4
   - `evals-guidelines.md Phase 6` / `Phase 7` → `04-evaluation.md` Phase 6
     / Phase 7
   - `design-considerations.md` references stay as-is (that file isn't
     renamed)

- [ ] **Step 5: Write `## 5. This Pattern Is Externally Validated`**

This replaces the old "Proof This Works" table (`agentic-system-pillars-guidelines.md`
§8, verified current lines 326–345, stopping before §9 at line 348) which
named Claude Code, Cursor/Windsurf, Devin, Manus AI, and Open Deep Research
— removed per the spec's explicit vendor-agnostic removal #4. Full
replacement text:

```markdown
## 5. This Pattern Is Externally Validated

Every claim in these five pillar files is checkable against public
research and engineering literature, not asserted from first principles:
the orchestration patterns in `01-orchestration.md` match Anthropic's own
published guidance on when multi-agent composition is worth its cost; the
memory taxonomy in `02-memory.md` is CoALA's own academic framework,
applied rather than reinvented; the evaluation discipline in
`04-evaluation.md` follows practices documented by OpenAI's agent-building
guide and independently by practitioners who've shipped LLM evals at scale
(see each file's own "External industry sources" section for the specific,
checkable citations). This folder cites the research and the reasoning, not
which commercial product happens to implement it well this quarter —
that list changes constantly; the underlying pattern doesn't.
```

- [ ] **Step 6: Write `## 6. Quick-Reference Checklist`**

Full text:

```markdown
## 6. Quick-Reference Checklist

- [ ] All 5 pillars have an explicit design — not just Orchestration and
      Evaluation; Memory, Tools, and Agent Skills are designed on purpose
- [ ] Each pillar's own detailed checklist is satisfied — see the
      `## Quick-Reference Checklist` section at the end of each of
      `01-orchestration.md` through `05-agent-skills.md`
- [ ] Passed the Smart Intern Test before building; SOP written and success
      criteria defined *before* the rubric is derived from it (§4 Steps 1–2)
- [ ] MVP built on manual inputs, tested against Step 1's examples, before
      Step 4's live orchestration (§4 Step 3)
- [ ] Deployed to a limited group first; cost/latency/accuracy monitored;
      production surprises loop back into the offline dataset (§4 Steps
      5–6, `04-evaluation.md` Phase 7)
```

- [ ] **Step 7: Write `## Reference index`**

Full text:

```markdown
## Reference index

- `ai-engine/CLAUDE.md` §2 — the engineering harness (context/loop/graph
  engineering) this doc's pillars map onto directly.
- `01-orchestration.md`, `02-memory.md`, `03-tools.md`, `04-evaluation.md`,
  `05-agent-skills.md` — the full depth for each pillar.
- `design/design-considerations.md` — autonomy levels L0–L4, referenced for
  Pillar 3's Execution-tool gating and Step 6's rollout discipline.
- `design/intent-and-build-guide.md` §2 — the Insights/vector-DB system
  that implements Pillar 2's episodic memory layer for SRE.

### External industry sources

- arXiv 2309.02427, ["Cognitive Architectures for Language Agents"
  (CoALA)](https://arxiv.org/abs/2309.02427) (Sumers et al.) — the core
  model this whole folder is organized around.
```

- [ ] **Step 8: Verify**

Run:
```bash
grep -in "crew\|deepagents\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|Claude Code\|Cursor\|Devin\|Manus AI\|Open Deep Research\|session_5\|session_6" "ai-engine/design/00-pillars-overview.md"
```
Expected: no output (empty match). If anything matches, fix it before
moving on — this file is the one every other file's overview links to, so
leftover vendor/crew language here is the highest-visibility miss.

---

### Task 2: `01-orchestration.md`

**Files:**
- Create: `ai-engine/design/01-orchestration.md`
- Read (source, do not modify): `ai-engine/design/agent-internal-architecture-guidelines.md`

**Interfaces:**
- Consumes: `00-pillars-overview.md`'s heading `## 3. CoALA → Pillar
  Mapping` (link target only, no content dependency).
- Produces: file `01-orchestration.md` with headings, in order:
  `## 1. The Decision-Making Loop: ReAct + CoALA's Planning Cycle`,
  `## 2. The Three Composable Patterns`,
  `## 3. Pattern 1 — Supervisor + Workers`,
  `## 4. Pattern 2 — Parallel Fan-Out / Fan-In`,
  `## 5. Pattern 3 — Writer + Critic Loop (Control Flow)`,
  `## 6. Right Model for the Job`,
  `## 7. Composing All Three: The Full Multi-Agent System`,
  `## 8. Failure Mode: Runaway Loop`,
  `## 9. Quick-Reference Checklist`, `## Reference index`. Later tasks
  (6, "05-agent-skills.md") link to `## 5. Pattern 3 — Writer + Critic Loop
  (Control Flow)` for the graph-wiring half of the critic loop.

- [ ] **Step 1: Write `## 1. The Decision-Making Loop: ReAct + CoALA's Planning Cycle`**

**Correction to source attribution:** this section replaces content that
lives in `agentic-system-pillars-guidelines.md` §2 "Pillar 1 —
Orchestration" (verified current lines 39–77: the ReAct loop ASCII diagram,
the "already fully mandated" mapping table, and the "One loop per node,
many nodes per crew" closing paragraph) — **not** anything in
`agent-internal-architecture-guidelines.md`, which has no standalone loop
diagram of its own. Replace that content with CoALA's more precise cycle,
which names Proposal and Evaluation as distinct sub-steps. Full text:

```markdown
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
```

- [ ] **Step 2: Write `## 2. The Three Composable Patterns`**

Migrate from `agent-internal-architecture-guidelines.md` lines 41–53 (the
intro sentence and the pattern table). No crew wording present in this
section — copy verbatim except update the "Reference" column's section
numbers to match this file's new numbering (§3, §4, §5 instead of §3, §4,
§7).

- [ ] **Step 3: Write `## 3. Pattern 1 — Supervisor + Workers`**

Migrate the diagram and "How delegation works" bullets from
`agent-internal-architecture-guidelines.md` lines 54–91 (§3's heading
through "Delegation *is* context management... the whole point of the
pattern," stopping before "### The subagent dict" at line 93) verbatim — no
crew wording there. **Then replace the subagent-dict subsection and the
`deepagents` code block (source lines 93–159, stopping before the `---` at
line 161) entirely** with pure LangGraph:

```markdown
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
```

- [ ] **Step 4: Write `## 4. Pattern 2 — Parallel Fan-Out / Fan-In`**

Migrate the diagram and bullets from
`agent-internal-architecture-guidelines.md` lines 163–203 (§4's heading
through the cross-track table, stopping before the `---` at line 204) —
the Concurrency/Isolation/Different-models bullets and the cross-track
table — verbatim; no crew wording there. **Add** a LangGraph `Send`-based code
example (this pattern currently has prose but no code in the source):

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

Add one sentence right before the code: "This is the literal LangGraph
mechanism behind the parallel `task()` calls described above — the
supervisor node returns a list of `Send` objects instead of one `Command`,
and LangGraph runs each targeted node concurrently."

**Drop the ITSM row from the migrated cross-track table** (per the
example-domain rule — this file's examples are SRE/Security only): the
table ends up with just the SRE and Security rows.

- [ ] **Step 5: Write `## 5. Pattern 3 — Writer + Critic Loop (Control Flow)`**

Migrate the diagram and the four control-flow bullets from
`agent-internal-architecture-guidelines.md` lines 268–290 (§7's heading
through "Draft → review against a rubric…" through "An un-capped critic
loop is the #1 multi-agent failure. Always bound it.", stopping before
"### Every agent needs a rubric" at line 292) verbatim — no crew wording
there. **Do not migrate** the "Every agent needs a rubric" subsection
(source lines 292–410, stopping before the `---` at line 411 — this
includes the rubric table, the gate-strength table, and the full
critic/rubric code block) — that content moves to `05-agent-skills.md`
Task 6. In its place, write:

```markdown
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
```

- [ ] **Step 6: Write `## 6. Right Model for the Job`**

Migrate the intro sentence and the "not every model drives a tool-calling
harness equally well" paragraph from
`agent-internal-architecture-guidelines.md` lines 187–222, but **replace
the model-name table and every named model** with generic roles:

```markdown
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
```

- [ ] **Step 7: Write `## 7. Composing All Three: The Full Multi-Agent System`**

Migrate the diagram, stage table, and closing paragraph from
`agent-internal-architecture-guidelines.md` lines 413–449 (§8 "Composing
All Three: The Full Crew," its heading through the ITSM/Security sentence,
stopping before the "Notebook:" citation at line 451) with these edits:
1. Section title and all body references: "crew" → "multi-agent system"
   (e.g. "One supervisor wiring every agent across several models" stays;
   "the SRE Postmortem Crew" → "the SRE incident-investigation multi-agent
   system").
2. The sentence citing "an ITSM 'Major Incident Summarization...' crew or a
   Security SOC incident-report crew" — keep the Security example, drop the
   ITSM one (per the example-domain rule; use Security alert-triage as the
   second example throughout this file instead of ITSM).
3. The "Notebook: `session_5/1_multi_agent_workflows.ipynb`" citation
   (source line 451) is already excluded by the migration range above —
   confirm it isn't accidentally carried over.

- [ ] **Step 8: Write `## 8. Failure Mode: Runaway Loop`**

Migrate only the "Runaway loop" row from
`agent-internal-architecture-guidelines.md`'s §9 failure table (source line
461, the first row) plus the "Hitting the recursion limit" closing
paragraph (source lines 466–469), reformatted as a standalone section
(not a shared table — the other three failure-table rows move to their
owning pillar files in Tasks 3–4, 6, sourced from the same table at lines
462–464):

```markdown
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
```

- [ ] **Step 9: Write `## 9. Quick-Reference Checklist`**

```markdown
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
```

- [ ] **Step 10: Write `## Reference index`**

```markdown
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
```

- [ ] **Step 11: Verify**

Run:
```bash
grep -in "crew\|deepagents\|create_deep_agent\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|session_5\|session_6\|ITSM" "ai-engine/design/01-orchestration.md"
```
Expected: no output. (The `ITSM` check confirms Step 7's edit removed the
ITSM example, per the example-domain rule.)

---

### Task 3: `02-memory.md`

**Files:**
- Create: `ai-engine/design/02-memory.md`
- Read (source, do not modify): `ai-engine/design/agentic-system-pillars-guidelines.md`

**Interfaces:**
- Consumes: nothing content-dependent from other new files.
- Produces: file `02-memory.md` with headings, in order:
  `## 1. The CoALA Memory Taxonomy`, `## 2. When to Write: An Update Policy
  Per Memory Type` (with `### Episodic writes`, `### Semantic writes`,
  `### Procedural writes (explicit)` subheadings), `## 3. Learning as the
  Third Internal Action`, `## 4. Mapping to LangGraph Primitives`,
  `## 5. Failure Mode: Supervisor Bloat`, `## 6. Quick-Reference
  Checklist`, `## Reference index`. This is the richest new-content task in
  the plan — most of this file did not exist in any source doc.

- [ ] **Step 1: Write `## 1. The CoALA Memory Taxonomy`**

Full text:

```markdown
# Pillar 2 — Memory

The Memory half of `Agent = LLM + Code + Memory` (`00-pillars-overview.md`
§1). Every example below is SRE/Observability or Security.

## 1. The CoALA Memory Taxonomy

CoALA splits memory into one short-term type and three long-term types —
not one undifferentiated "context" bucket:

| Memory type | CoALA's definition | In this repo |
|---|---|---|
| **Working memory** | Information for the current decision cycle only — ephemeral, gone once the cycle ends | Typed LangGraph `State` fields: evidence gathered, hypotheses ruled out mid-run |
| **Episodic memory** | A record of specific past *experience* — what happened, not a general rule | A specific past incident and how it was resolved |
| **Semantic memory** | General *knowledge* — facts and relationships, decontextualized from any one event | Service topology, the failure-domain taxonomy, asset-criticality ratings |
| **Procedural memory** | *How* to do something — split into **implicit** (the LLM's own weights) and **explicit** (agent code, prompts, rubrics, retrieval strategy) | This repo never fine-tunes (implicit is out of scope); explicit procedural memory is `05-agent-skills.md`'s entire subject |

**Why the split matters, concretely:** an SRE agent's episodic memory (a
past connection-pool-exhaustion incident) and its semantic memory (the
service's dependency graph) answer two different questions — "has this
happened before, and how was it fixed" vs. "what does this service
actually depend on, right now" — and they update on entirely different
triggers (§2 below). Collapsing them into one "knowledge base" makes both
questions harder to answer correctly.
```

- [ ] **Step 2: Write `## 2. When to Write: An Update Policy Per Memory Type`**

This is net-new content, not present in any source file. Full text:

```markdown
## 2. When to Write: An Update Policy Per Memory Type

Memory that anyone can write, anytime, from any confidence level, isn't
memory — it's noise with extra steps. CoALA's own "Guide Building of Future
Language Agents" section frames this as "Learning" (Action Space, internal)
split by which memory it targets. This section is that policy, made
concrete for this repo's stack.

### Episodic writes

**Trigger: on close, not mid-task.** An episodic write happens only after
the outcome is confirmed — not as a live scratchpad during investigation.

- **SRE/Observability example:** a resolved incident's root cause and
  resolution steps write to episodic memory only after the postmortem is
  reviewed and approved (`05-agent-skills.md` §3's rubric gate) — not
  during triage, while the root cause is still a hypothesis. Writing mid-
  investigation would let a wrong early guess get retrieved as if it were
  confirmed fact on the next similar incident.
- **Security example:** a closed alert investigation (true/false-positive
  verdict plus the evidence that supported it) writes to episodic memory
  only after SOC analyst sign-off — an investigation still in progress
  never contributes to future retrieval, so an ambiguous, unresolved alert
  can't poison the next investigation that resembles it.

### Semantic writes

**Trigger: on a confirmed, reviewed fact — never a hypothesis.** Semantic
memory is general knowledge; writing an unverified claim into it corrupts
every future retrieval that depends on it, not just the current task.

- **SRE/Observability example:** the service topology and failure-domain
  taxonomy update through a reviewed change — e.g. a new service's
  dependency edges get added to the topology graph after a deploy is
  confirmed, never inferred mid-incident from an agent's guess about what
  probably depends on what.
- **Security example:** asset-criticality ratings and identity/access
  baselines update on a scheduled review cycle or a confirmed CMDB/org-
  chart change — never from a single alert's unverified claim, even if that
  alert turns out to be correct. One correct-by-luck inference is not the
  same evidence bar as a reviewed change.

### Procedural writes (explicit)

**Trigger: a reviewed PR, through Langfuse prompt management — never
inline.** This is CoALA's highest-risk, least-studied form of agent
learning, and the repo already has the infrastructure to make it safe: a
rubric or system-prompt change is a versioned artifact
(`05-agent-skills.md` §3), diffable and rollback-able, not a live edit an
agent (or a person, casually) makes mid-session.

- **Why this is stricter than episodic/semantic:** a bad episodic or
  semantic write corrupts one fact. A bad procedural write changes *how
  every future task gets reasoned about* — the blast radius is
  categorically larger, which is exactly why CoALA flags implicit
  procedural updates (fine-tuning) as the riskiest form of learning a
  language agent can do. This repo avoids that risk entirely by never
  fine-tuning — all procedural learning here is explicit and reviewed.
```

- [ ] **Step 3: Write `## 3. Learning as the Third Internal Action`**

```markdown
## 3. Learning as the Third Internal Action

CoALA names three internal actions: Reasoning and Retrieval
(`01-orchestration.md` §1) and **Learning** — writing to long-term memory,
which is everything in §2 above. A node that never writes to episodic or
semantic memory can still reason and retrieve, but it never gets better
across incidents — it re-derives the same conclusion from scratch every
time a similar SRE incident or security alert recurs. Learning is what
CoALA's own "reveal lots of gaps" framing points at: most shipped agents
implement Reasoning and Retrieval well and Learning barely at all. The
write-policy in §2 is this repo's answer to that gap — narrow and
deliberate, not absent.
```

- [ ] **Step 4: Write `## 4. Mapping to LangGraph Primitives`**

```markdown
## 4. Mapping to LangGraph Primitives

| Memory type | LangGraph primitive |
|---|---|
| Working memory | Typed `State` fields, scoped to one graph run |
| Episodic / semantic memory | `Store` — cross-thread, keyed for retrieval-by-similarity (episodic) or retrieval-by-exact-key (semantic) |
| Session memory (multi-turn state within one run) | The checkpointer, per-thread |
| Explicit procedural memory | Not a LangGraph primitive — lives in Langfuse prompt management (`CLAUDE.md` §3), fetched at node-init time, not stored in graph state at all |

**A `Store` write is not automatic.** Nothing in LangGraph enforces the §2
policy for you — a node can call `store.put(...)` from anywhere in its
execution. The policy is enforced by *where in the graph* the write call is
placed (the node that runs after the rubric-gated approval, not the node
that runs during triage), which is a design decision, not a LangGraph
setting.
```

- [ ] **Step 5: Write `## 5. Failure Mode: Supervisor Bloat`**

Migrate the "Supervisor bloat" row from
`agent-internal-architecture-guidelines.md`'s §9 failure table (source line
463, the third row) plus the isolation principle it's paired with (source
lines 90–91, "Delegation *is* context management..."), reformatted:

```markdown
## 5. Failure Mode: Supervisor Bloat

| Symptom | Fix |
|---|---|
| Supervisor's working memory fills with raw worker output | Workers return summaries only; detail goes to episodic/semantic memory via `Store` (§4), never inline in the supervisor's `State` |

**Delegation *is* memory management.** A supervisor that accumulates every
worker's full raw output in its own working memory hasn't built a
multi-agent system — it's built one enormous context window with extra
function calls. The fix is structural, not a prompt instruction: a worker
node's `Command` update (`01-orchestration.md` §3) carries only a summary
string, by construction — there's no raw output left for the supervisor to
accumulate.
```

- [ ] **Step 6: Write `## 6. Quick-Reference Checklist`**

```markdown
## 6. Quick-Reference Checklist

- [ ] All four memory types are identified explicitly for this
      agent/system — what's working vs. episodic vs. semantic vs.
      procedural is a decision, not an accident (§1)
- [ ] Episodic writes happen on close, not mid-task (§2)
- [ ] Semantic writes happen only on a confirmed, reviewed fact (§2)
- [ ] Procedural writes go through Langfuse prompt management on a
      reviewed PR — never inline (§2)
- [ ] Long-term memory uses `Store`; working memory uses `State`; nothing
      long-term is smuggled into `State` just because it's convenient (§4)
- [ ] Workers return summaries, not raw output — detail lives in memory,
      not the supervisor's working memory (§5)
```

- [ ] **Step 7: Write `## Reference index`**

```markdown
## Reference index

- `00-pillars-overview.md` — the umbrella 5-pillar framework this doc is
  the full depth for (Pillar 2, Memory).
- `ai-engine/CLAUDE.md` §2.1 — context engineering (minimum necessary
  context, ground don't dump, tenant/role scoping as part of context).
- `01-orchestration.md` §1 — Reasoning and Retrieval, CoALA's other two
  internal actions, owned by the Orchestration pillar.
- `05-agent-skills.md` — explicit procedural memory in full depth (the
  other half of CoALA's procedural memory category).
- `intent-and-build-guide.md` §2 — the Insights/vector-DB system that
  implements episodic memory for SRE (historical incidents, retrieved by
  similarity).

### External industry sources

- arXiv 2309.02427, ["Cognitive Architectures for Language Agents"
  (CoALA)](https://arxiv.org/abs/2309.02427) (Sumers et al.) — the entire
  taxonomy and write-policy framing in this file.
- Anthropic, ["Effective context engineering for AI
  agents"](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  — backs compaction and structured note-taking as techniques for when
  working/session memory grows too large.
```

- [ ] **Step 8: Verify**

Run:
```bash
grep -in "crew\|deepagents\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|ITSM" "ai-engine/design/02-memory.md"
```
Expected: no output.

---

### Task 4: `03-tools.md`

**Files:**
- Create: `ai-engine/design/03-tools.md`
- Read (source, do not modify): `ai-engine/design/agentic-system-pillars-guidelines.md`, `ai-engine/design/agent-internal-architecture-guidelines.md`

**Interfaces:**
- Consumes: nothing content-dependent from other new files.
- Produces: file `03-tools.md` with headings, in order:
  `## 1. Grounding: CoALA's External Action`, `## 2. Tool Categories`,
  `## 3. MCP as the Standard Interface`, `## 4. Gate the Tool Call, Not
  Just the Agent`, `## 5. Agents That See — the Vision/Multimodal Worker`,
  `## 6. Failure Mode: Tool Call Fails`, `## 7. Quick-Reference
  Checklist`, `## Reference index`.

- [ ] **Step 1: Write `## 1. Grounding: CoALA's External Action`**

```markdown
# Pillar 3 — Tools

How Code (`01-orchestration.md`) reaches outside itself. Every example
below is SRE/Observability or Security.

## 1. Grounding: CoALA's External Action

CoALA calls this **grounding** — the one action category that touches
something outside the agent's own reasoning and memory: querying an API,
executing a search, reading a screenshot, calling any MCP tool. Every
other CoALA internal action (Reasoning, Retrieval, Learning) stays inside
the agent; grounding is the only place risk from the outside world enters,
and the only place the agent's actions can affect something outside
itself. That's why gating (§4) is a Tools-pillar concern, not an
Orchestration-pillar one — the loop *decides* to call a tool
(`01-orchestration.md` §1), but what that call is allowed to do is decided
here.
```

- [ ] **Step 2: Write `## 2. Tool Categories`**

Migrate the tool-categories table from `agentic-system-pillars-guidelines.md`
lines 118–129, verbatim (no crew wording present).

- [ ] **Step 3: Write `## 3. MCP as the Standard Interface`**

Migrate the "Every category funnels through one mechanism: MCP" paragraph
from `agentic-system-pillars-guidelines.md` lines 127–129, verbatim.

- [ ] **Step 4: Write `## 4. Gate the Tool Call, Not Just the Agent`**

Migrate the "Gate the tool call, not just the agent" paragraph from
`agentic-system-pillars-guidelines.md` (the fix added in the last
gap-check round, currently right after §4's table), verbatim — no crew
wording present.

- [ ] **Step 5: Write `## 5. Agents That See — the Vision/Multimodal Worker`**

Migrate from `agent-internal-architecture-guidelines.md` §6 (verified
current lines 233–264: "A multimodal worker reads what text can't
describe" through the "Cross-track" closing sentence, stopping before the
`---` at line 266) with these edits:
1. Replace "worker" with "node" only where it reads more naturally standing
   alone outside the old "crew" framing — otherwise keep as-is (this
   section never used the word "crew" itself).
2. The closing "Cross-track" sentence currently reads "a Security crew
   reads a SIEM alert screenshot the same way; an ITSM crew reads a CMDB
   service-map diagram the same way" — replace with: "a Security node
   reads a SIEM alert screenshot the same way — the mechanism doesn't
   change, only what's in the image."  (Drop the ITSM clause per the
   example-domain rule; this file's examples are SRE/Security only.)
3. Add one linking sentence right after the code example: "This is a
   grounding action like any other in this file — the only difference is
   the tool result is pixels instead of text."

- [ ] **Step 6: Write `## 6. Failure Mode: Tool Call Fails`**

**Correction to source attribution:** this row lives in
`agent-internal-architecture-guidelines.md`'s §9 failure table (source line
462, the second row — added as a gap-check fix earlier this session), not
`agentic-system-pillars-guidelines.md`, which has no failure table of its
own. Migrate it from there, reformatted as a standalone section:

```markdown
## 6. Failure Mode: Tool Call Fails

| Symptom | Fix |
|---|---|
| A worker cascades on a bad result, or fabricates instead of retrying | Retry-with-backoff + circuit breaker on the call — distinct from `recursion_limit` (`01-orchestration.md` §8), which bounds delegation depth, not call attempts |

This is what earns the "Recovery-from-failure" score `04-evaluation.md` §2
measures — a tool call failing is expected and recoverable; the failure
mode is the agent papering over it with a guess instead of retrying or
surfacing the gap.
```

- [ ] **Step 7: Write `## 7. Quick-Reference Checklist`**

```markdown
## 7. Quick-Reference Checklist

- [ ] Every tool is a scoped MCP tool, categorized per §2 — not a bespoke
      function bolted on ad hoc
- [ ] Every tool **call** — not just the agent overall — is risk-rated;
      mutating ("Execution") calls are gated at Autonomy Level L2+ with
      `interrupt()` (§4)
- [ ] A vision/multimodal tool is used wherever the source evidence is
      visual (dashboard, diagram, screenshot), not forced through text (§5)
- [ ] Tool calls have retry-with-backoff and a circuit breaker, distinct
      from the orchestration-level recursion limit (§6)
```

- [ ] **Step 8: Write `## Reference index`**

```markdown
## Reference index

- `00-pillars-overview.md` — the umbrella 5-pillar framework this doc is
  the full depth for (Pillar 3, Tools).
- `01-orchestration.md` §1 — the decision loop that calls these tools; this
  file covers what a call is allowed to do, not when it happens.
- `intent-and-build-guide.md` — "MCP servers/tools as the standard
  interface between agents and internal systems," the source of this
  pillar's MCP mandate.
- `design-considerations.md` — autonomy levels L0–L4, the basis for §4's
  per-tool-call risk gating.

### External industry sources

- OpenAI, ["A Practical Guide to Building
  Agents"](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
  — backs per-tool-call risk rating (§4).
- AWS Well-Architected Framework,
  [REL_5](https://wa.aws.amazon.com/wellarchitected/2020-07-02T19-33-23/wat.question.REL_5.en.html)
  — backs retry-with-backoff + circuit breaker (§6).
- Cloud Security Alliance, [Agentic MCP Security Best
  Practices](https://labs.cloudsecurityalliance.org/agentic/agentic-mcp-security-best-practices-v1/)
  — confirms MCP's current adoption as the standard agent-tool interface
  (§3).
```

- [ ] **Step 9: Verify**

Run:
```bash
grep -in "crew\|deepagents\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|ITSM" "ai-engine/design/03-tools.md"
```
Expected: no output.

---

### Task 5: `04-evaluation.md`

**Files:**
- Create: `ai-engine/design/04-evaluation.md`
- Read (source, do not modify): `ai-engine/design/evals-guidelines.md`

**Interfaces:**
- Consumes: nothing content-dependent from other new files.
- Produces: file `04-evaluation.md`, headings identical to the source
  file's current structure (renumbered nowhere — section numbers §1–§5
  stay §1–§5): `## 1. Why Agent Evaluation Is a Different Job`,
  `## 2. The Four Evaluators — Used Together, On the Same Run`,
  `## 3. The Agent Testing Pyramid — Mapped to Our LangGraph Agents`,
  `## 4. Step-by-Step: Evals Across the Agent Development Lifecycle`,
  `## 5. Quick-Reference Checklist`, `## Reference index`.

- [ ] **Step 1: Copy the entire source file verbatim**

Copy all content from `evals-guidelines.md` into `04-evaluation.md`,
including its title, intro paragraph, and every section — this file needs
no structural changes, only the targeted edits in Steps 2–4 below.

- [ ] **Step 2: Fix all four "crew" instances, and genericize the two named
      models in the same paragraph as one of them**

Verified via `grep -n "crew" evals-guidelines.md` — four occurrences, not
two:

1. **Source line 74–78** (§2, the self-preference-bias example paragraph):
   "in the crew from `agent-internal-architecture-guidelines.md` §5, the
   writer runs on `gpt-oss-120b` — so its critic runs on `DeepSeek-V3.2`, a
   different family..." → rewrite as: "in the multi-agent system from
   `01-orchestration.md` §6, the writer runs on Model C (a fast, pure-text
   role) — so its critic runs on Model B (a different family, assigned to
   analytical/critique roles)". This paragraph has two named models that
   Step 1's verbatim copy would otherwise carry over uncaught by the
   crew-word search alone — genericize both here.
2. **Source lines 161, 164** (the reconciliation note right after the
   Phase 1 dataset table): "the postmortem-drafting crew from
   `agent-internal-architecture-guidelines.md`" → "the
   incident-investigation multi-agent system from `01-orchestration.md`";
   "a separate, later-designed crew built on the same domain" → "a
   separate, later-designed multi-agent system built on the same domain."
3. **Source line 194** (Phase 4, "How a regression sneaks in" example):
   "'the crew is expensive — let the supervisor answer directly instead of
   delegating.'" → "'the multi-agent system is expensive — let the
   supervisor answer directly instead of delegating.'"

Also update the filename reference in the reconciliation note (source line
165): "that doc's Reference index makes the same distinction from its
side" → confirm `01-orchestration.md`'s Reference index (Task 2, Step 10)
still carries the equivalent domain-1-vs-analyst-names distinction — it
does, migrated there verbatim.

- [ ] **Step 3: Drop the SambaNova/DSD webinar citation**

Remove the entire "Implementation reference" blockquote from the file's
intro (currently: "Data Science Dojo × SambaNova 'Deep Agents' webinar,
Session 6 (`session_6/1_evaluation_production.ipynb`...)"), and remove the
matching "Implementation reference notebook" bullet from the Reference
index at the bottom of the file.

- [ ] **Step 4: Update remaining cross-references**

Verified via `grep -n "agent-internal-architecture-guidelines.md\|agentic-system-pillars-guidelines.md"
evals-guidelines.md` — four occurrences; **not a uniform find/replace**,
because the old file's content is now split across two new files:

- **Source line 58** (§2, "keeps the rubric's scoring shape consistent with
  the critic in `agent-internal-architecture-guidelines.md` §7, which
  already returns `APPROVE`/`REVISE`") → this is a reference to the rubric
  content specifically, which now lives in `05-agent-skills.md` — update to
  `05-agent-skills.md` §4, **not** `01-orchestration.md`.
- **Source line 75** (already rewritten in Step 2, item 1, to reference
  `01-orchestration.md` §6 — the model table) — no further change needed
  here.
- **Source line 162** (already rewritten in Step 2, item 2, to reference
  `01-orchestration.md` — the multi-agent system's composition generally)
  — no further change needed here.
- **Source line 364** (Reference index bullet, currently "`design/agentic-system-pillars-guidelines.md`
  — the umbrella 5-pillars framework...") → update the filename to
  `design/00-pillars-overview.md`.

- [ ] **Step 5: Verify**

Run:
```bash
grep -in "crew\|deepagents\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|session_5\|session_6" "ai-engine/design/04-evaluation.md"
```
Expected: no output.

---

### Task 6: `05-agent-skills.md`

**Files:**
- Create: `ai-engine/design/05-agent-skills.md`
- Read (source, do not modify): `ai-engine/design/agentic-system-pillars-guidelines.md`, `ai-engine/design/agent-internal-architecture-guidelines.md`

**Interfaces:**
- Consumes: `01-orchestration.md` §5's graph-wiring code (Task 2, Step 5) —
  this file's `critic_node` is what that wiring calls.
- Produces: file `05-agent-skills.md` with headings, in order:
  `## 1. What Makes a Skill: Packaged, Domain-Specific, Composable,
  Guardrailed`, `## 2. Progressive Disclosure`,
  `## 3. Every Agent Needs a Rubric — Not Just the Writer`,
  `## 4. The Critic: Validating a Skill's Output Against Its Rubric`,
  `## 5. Failure Mode: Worker Drift`, `## 6. Quick-Reference Checklist`,
  `## Reference index`.

- [ ] **Step 1: Write `## 1. What Makes a Skill: Packaged, Domain-Specific, Composable, Guardrailed`**

Migrate from `agentic-system-pillars-guidelines.md` §6 (the "Composable
capabilities that turn reasoners into doers" intro, the skill-architecture
diagram, and the four bullets: Packaged/Domain-specific/Composable/
Guardrailed), verbatim — this section already references
`logs_analyst`/`metrics_analyst`/`dashboard_analyst` by name, not "crew,"
so no rename needed. Add the file's opening frame:

```markdown
# Pillar 5 — Agent Skills

The explicit half of procedural memory (`02-memory.md` §1) — the part of
"how to do the task" that lives in a readable prompt or rubric, not opaque
model weights. Every example below is SRE/Observability or Security.

## 1. What Makes a Skill: Packaged, Domain-Specific, Composable, Guardrailed
```

(then the migrated content follows)

- [ ] **Step 2: Write `## 2. Progressive Disclosure`**

Migrate the "Progressive disclosure is what makes 'composable' affordable"
paragraph from `agentic-system-pillars-guidelines.md` §6, verbatim.

- [ ] **Step 3: Write `## 3. Every Agent Needs a Rubric — Not Just the Writer`**

Migrate from `agent-internal-architecture-guidelines.md` §7's "Every agent
needs a rubric — not just the writer" subsection (verified current source
lines 292–327: the subsection heading, the intro paragraph, "A rubric is
short, specific..." paragraph, the per-agent rubric table, the "Two
strengths of critic gate" table and its example paragraph) with these
edits:
1. Remove the sentence "The writer/critic loop above is the *strongest*
   version of a pattern..." — replace "The writer/critic loop above" with
   "The writer/critic control flow in `01-orchestration.md` §5" since the
   loop itself is no longer described in this file.
2. No "crew" wording present in this subsection — no rename needed.
3. Keep the `logs_analyst`/`metrics_analyst`/`deploy_analyst`/
   `dashboard_analyst`/`writer` rubric table exactly as-is.
4. Add one closing sentence tying this to CoALA: "This rubric table *is*
   explicit procedural memory (`02-memory.md` §1) — 'how to do the task,
   specifically,' written down and versioned rather than left implicit in
   a model's weights."

- [ ] **Step 4: Write `## 4. The Critic: Validating a Skill's Output Against Its Rubric`**

Migrate the full critic/rubric code block and its surrounding explanatory
paragraphs from `agent-internal-architecture-guidelines.md` §7, from three
verified, non-contiguous source ranges (do not migrate the gaps between
them — they're covered separately in Task 2 Step 5, and duplicating them
here would leave the same paragraph in both files):
- **Lines 329–357** — the `POSTMORTEM_RUBRIC` constant, the `CriticVerdict`
  class, `CRITIC_MODEL`, `critic_structured`, and `critic_node`. **Stop
  before line 359** — `route_from_critic` (359–364) and `escalate_to_human`
  (366–372) stay in `01-orchestration.md` per Task 2 Step 5; do not migrate
  them here.
- **Lines 375–393** — the "Verdict is a schema, not free text" paragraph
  and the "Pin `temperature=0` on every judge/critic role" paragraph.
  **Skip lines 395–398** — the "Cap-hit is a real graph node, not a
  comment" paragraph is about `escalate_to_human`/`interrupt()` and was
  already written fresh into `01-orchestration.md` §5 (Task 2 Step 5); it
  does not belong here too.
- **Lines 400–409** — the closing "same shape... applies to any subagent"
  paragraph and "This rubric is the same artifact `evals-guidelines.md` §2
  calls the LLM-as-a-judge rubric" paragraph.

Edits:
1. Update the code so `critic_node` is presented standalone (it no longer
   needs to reference `route_from_critic` in the same block — that lives in
   `01-orchestration.md` §5 now). Add a one-line comment above `critic_node`:
   `# critic_node's return value feeds route_from_critic in 01-orchestration.md §5`.
2. Replace "the same rubric constant, imported in both places" (closing
   paragraph) with: "the same rubric, fetched from the same Langfuse
   prompt-management key in both places" — matches the versioning language
   established elsewhere in this folder, not a stale "hardcoded constant"
   framing.
3. Replace every reference to `evals-guidelines.md` with `04-evaluation.md`.
4. Replace "any subagent" with "any skill" where it reads more naturally
   given this file's framing (e.g. "Swap `POSTMORTEM_RUBRIC` for a
   `metrics_analyst`-scoped rubric and the single-pass gate is the same
   code" — keep as-is, this sentence already reads fine).
5. No "crew" wording present in this subsection — no rename needed.

- [ ] **Step 5: Write `## 5. Failure Mode: Worker Drift`**

Migrate the "Worker drift" row from
`agent-internal-architecture-guidelines.md`'s §9 failure table (source line
464, the fourth/last row), reformatted:

```markdown
## 5. Failure Mode: Worker Drift

| Symptom | Fix |
|---|---|
| An analyst answers a different question than asked | Sharp, single-responsibility system prompt per skill (§1) — and a rubric (§3) that would fail a drifted answer even if the prose sounds confident |
```

- [ ] **Step 6: Write `## 6. Quick-Reference Checklist`**

```markdown
## 6. Quick-Reference Checklist

- [ ] Every skill has defined inputs, outputs, **and** an explicit failure
      mode — not just a happy path (§1)
- [ ] Only a skill's name+description sits in context until it's actually
      triggered — progressive disclosure (§2)
- [ ] Every agent has a written rubric — its definition of done, versioned
      in Langfuse, not re-derived on the fly (§3)
- [ ] A critic validates every agent's output against its rubric — full
      loop for deliverable-producing agents, single-pass gate for fan-out
      analysts feeding another agent (§4)
- [ ] The critic's verdict is a schema-enforced structured output with
      `temperature=0` pinned (§4)
- [ ] A drifted, off-topic-but-confident-sounding answer fails the rubric,
      not just an obviously-wrong one (§5)
```

- [ ] **Step 7: Write `## Reference index`**

```markdown
## Reference index

- `00-pillars-overview.md` — the umbrella 5-pillar framework this doc is
  the full depth for (Pillar 5, Agent Skills).
- `01-orchestration.md` §5 — the graph wiring that calls `critic_node`;
  this file covers what it checks, not how it's wired.
- `02-memory.md` §1 — explicit procedural memory, the CoALA category this
  entire pillar is the concrete form of.
- `04-evaluation.md` §2 — the LLM-as-a-judge rubric this file's rubric is
  the same artifact for; that doc is downstream of this one.

### External industry sources

- Anthropic, [Agent Skills
  docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
  — backs progressive disclosure (§2).
- [12-Factor Agents](https://github.com/humanlayer/12-factor-agents),
  Factor 4 "Tools are just structured outputs" — backs the schema-enforced
  `CriticVerdict` (§4).
- Langfuse [Prompt Management
  docs](https://langfuse.com/docs/prompt-management/overview) — backs
  versioned rubrics (§3).
```

- [ ] **Step 8: Verify**

Run:
```bash
grep -in "crew\|deepagents\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|ITSM" "ai-engine/design/05-agent-skills.md"
```
Expected: no output.

---

### Task 7: Update `ai-engine/CLAUDE.md` cross-references

**Files:**
- Modify: `ai-engine/CLAUDE.md`

**Interfaces:**
- Consumes: the 6 new filenames from Tasks 1–6 (all must exist before this
  task runs).
- Produces: no new interface — this task only fixes pointers.

- [ ] **Step 1: Update §2.3's pointer**

Find the sentence added during this session's earlier gap-check work: "See
`design/agent-internal-architecture-guidelines.md` for the full
step-by-step build guide..." — replace the filename with
`design/01-orchestration.md`, and add a second sentence: "See
`design/02-memory.md`, `design/03-tools.md`, and `design/05-agent-skills.md`
for the Memory, Tools, and Agent Skills pillars respectively."

- [ ] **Step 2: Update the "(Orchestration = §2.2–2.3; Memory = §2.1)" pointer**

In the same section (the sentence pointing to
`design/agentic-system-pillars-guidelines.md`), replace the filename with
`design/00-pillars-overview.md`.

- [ ] **Step 3: Update §4's pointer**

Find "See `design/evals-guidelines.md` for the full step-by-step
evaluation plan" — replace the filename with `design/04-evaluation.md`.

- [ ] **Step 4: Update §5's Reference index**

Replace all three bullets currently pointing to
`design/agentic-system-pillars-guidelines.md`,
`design/agent-internal-architecture-guidelines.md`, and
`design/evals-guidelines.md` with six bullets pointing to
`design/00-pillars-overview.md` through `design/05-agent-skills.md`,
keeping each bullet's existing one-line description but updating the
filename.

- [ ] **Step 5: Verify**

Run:
```bash
grep -n "evals-guidelines.md\|agent-internal-architecture-guidelines.md\|agentic-system-pillars-guidelines.md" "ai-engine/CLAUDE.md"
```
Expected: no output (all references updated to the new filenames).

---

### Task 8: Delete the 3 superseded files

**Files:**
- Delete: `ai-engine/design/evals-guidelines.md`
- Delete: `ai-engine/design/agent-internal-architecture-guidelines.md`
- Delete: `ai-engine/design/agentic-system-pillars-guidelines.md`

**Interfaces:**
- Consumes: confirmation that Tasks 1–7 are complete and verified — this
  task is destructive and runs last, on purpose, so every migration task
  had its source file available to read from.

- [ ] **Step 1: Confirm every migration task's Verify step passed**

Re-run all six grep checks from Tasks 1–6 Step "Verify" in one pass:
```bash
grep -rin "crew\|deepagents\|create_deep_agent\|MiniMax\|DeepSeek-V3\|gpt-oss\|gemma-4\|SambaNova\|session_5\|session_6" ai-engine/design/0*.md
```
Expected: no output. Do not proceed to Step 2 until this is clean.

- [ ] **Step 2: Confirm no other file in the repo references the 3 old filenames**

```bash
grep -rn "evals-guidelines.md\|agent-internal-architecture-guidelines.md\|agentic-system-pillars-guidelines.md" --include="*.md" .
```
Expected: no output (Task 7 already fixed `ai-engine/CLAUDE.md`; this
confirms nothing else in the repo — e.g. root `CLAUDE.md`,
`intent-and-build-guide.md` — references them). If anything matches, fix
that reference before deleting.

- [ ] **Step 3: Delete the 3 files**

```bash
rm "ai-engine/design/evals-guidelines.md" \
   "ai-engine/design/agent-internal-architecture-guidelines.md" \
   "ai-engine/design/agentic-system-pillars-guidelines.md"
```

- [ ] **Step 4: Final directory check**

```bash
ls ai-engine/design/
```
Expected: exactly `00-pillars-overview.md`, `01-orchestration.md`,
`02-memory.md`, `03-tools.md`, `04-evaluation.md`, `05-agent-skills.md`,
plus the four untouched files (`design-considerations.md`,
`intent-and-build-guide.md`, `synthetic-rca-eval-design-considerations.md`,
`synthetic-rca-eval-build-blueprint.md`).

---

### Task 9: Cross-file consistency pass

**Files:**
- Read (verify only, no modification unless a fix is needed):
  `ai-engine/design/00-pillars-overview.md` through
  `ai-engine/design/05-agent-skills.md`, `ai-engine/CLAUDE.md`

**Interfaces:**
- Consumes: all 6 new files, complete.
- Produces: nothing new — this task only catches cross-file drift the
  per-task verifies couldn't see (each earlier task only checked its own
  file in isolation).

- [ ] **Step 1: Verify every internal cross-reference resolves**

For each of the 6 files, grep for section-reference patterns (`§\d`,
backtick-wrapped filenames) and manually confirm the target file/section
exists with that exact number, per the "Produces" interface blocks in
Tasks 1–6 above. Pay special attention to: `01-orchestration.md` §5 ↔
`05-agent-skills.md` §3–§4 (the critic split), and every file's `§8`/`§6`/
etc. self-references (a file renumbering one of its own sections without
updating a cross-reference elsewhere in the same file is the most likely
drift).

- [ ] **Step 2: Verify the example-domain rule held**

```bash
grep -in "ITSM" ai-engine/design/0*.md
```
Expected: no output across all 6 files (per Global Constraints — ITSM
examples are out of scope for this restructure entirely, even though the
repo-wide rule elsewhere allows them).

- [ ] **Step 3: Verify no file is orphaned or unreferenced**

Confirm `00-pillars-overview.md` §2's table links to all 5 other files, and
each of the 5 pillar files' own `## Reference index` links back to
`00-pillars-overview.md`.

- [ ] **Step 4: Report a summary of any fixes made in this task**

If Steps 1–3 required any fixes, list them (file, section, what was wrong,
what was changed) so the user can see exactly what drifted during
independent task execution and got caught here. If nothing needed fixing,
say so plainly.
