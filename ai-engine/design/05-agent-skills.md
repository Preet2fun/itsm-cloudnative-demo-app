# Pillar 5 — Agent Skills

The explicit half of procedural memory (`02-memory.md` §1) — the part of
"how to do the task" that lives in a readable prompt or rubric, not opaque
model weights. Every example below is SRE/Observability or Security.

## 1. What Makes a Skill: Packaged, Domain-Specific, Composable, Guardrailed

Composable capabilities that turn reasoners into doers.

```
                Agent Orchestrator
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
  logs_analyst    metrics_analyst   dashboard_analyst
   skill:          skill:            skill:
   search_logs     query_metrics     read_dashboard
       │                │                │
       └────────────────┴────────────────┘
                        ▼
                 Validated Output
```

**This is not a new concept** — it's the design discipline behind the
scoped tools list already defined on every worker node in
`01-orchestration.md` §3. A skill is:

- **Packaged** — a reusable, well-tested behavior an agent invokes, not
  freshly reasoned out each time.
- **Domain-specific** — scoped to one job (`search_logs`, not "do anything
  with logs").
- **Composable** — `logs_analyst`'s skill and `metrics_analyst`'s skill
  combine inside one fan-out (`01-orchestration.md` §4) to build one
  findings set.
- **Guardrailed** — defined inputs, outputs, **and an explicit failure
  mode**, not just a happy path.

**Example — the "guardrailed" part is the part that's easy to skip:**

| Skill | Input | Output | Failure mode |
|---|---|---|---|
| `postmortem-drafting` (SRE) | Analyst findings files | Draft in the rubric's required shape (§3) | Insufficient evidence → returns an explicit flag, not a fabricated cause (ties to the Hallucination row, `04-evaluation.md` §4 Phase 4) |
| `threat-intel-lookup` (Security) | An IOC | Matched advisory + source | No match → "no intel found," not a guessed severity |

**Skills turn agents from general reasoners into specialized executors.**
Without the failure-mode column, a skill degrades back into "call the model
and hope" — the exact gap the rubric + critic gate (§4) exists to close.

---

## 2. Progressive Disclosure

**Progressive disclosure is what makes "composable" affordable.**
Anthropic's own Agent Skills design loads in three tiers: metadata (name +
description, ~100 tokens) always sits in context; full instructions (<5k
tokens) load only when a skill is actually triggered; resources/scripts load
only when referenced. **Applied:** `logs_analyst`'s skill
(`mcp__observability__search_logs`, `01-orchestration.md` §3) costs the
supervisor only its name and description until the moment it's actually
delegated to — stacking five more analyst skills onto the multi-agent
system doesn't cost five more full instruction sets in context, only five
more short descriptions. Skip this and "composable" quietly becomes "every
skill's full instructions loaded all the time" — the same context-bloat
failure mode `02-memory.md` §5 already warns about.

---

## 3. Every Agent Needs a Rubric — Not Just the Writer

The writer/critic control flow in `01-orchestration.md` §5 is the
*strongest* version of a pattern that should apply to **every** worker in
the multi-agent system: a written rubric defining what "correct" looks like
for that agent's one job, and a critic step that checks the agent's actual
output against it before the result is trusted downstream. Without this, a
wrong `metrics_analyst` finding sails straight into the writer's draft and
nothing ever catches it — the critic loop only protects the last step, not
the ones feeding it.

**A rubric is short, specific to one agent's single responsibility, and
lives next to that agent's `system_prompt`** — not re-derived by the critic
on the fly (same determinism-as-a-contract discipline `04-evaluation.md`
already requires for eval fixtures).

| Agent | Rubric — its "definition of done" |
|---|---|
| `logs_analyst` | Cites actual line numbers from `logs.txt`; names one specific anomalous event, not "something looks off" |
| `metrics_analyst` | Every claim is backed by a queried number; states baseline **and** peak, not just one |
| `deploy_analyst` | Names the specific deploy ID/timestamp; states *what* changed, not just "a deploy happened" |
| `dashboard_analyst` | Reports baseline, peak, **and** duration — all three, not a subset |
| `writer` | Specific, evidence-cited root cause; impact quantified; all sections present; concrete action items; blameless tone |

Two strengths of critic gate, matched to how much a wrong answer costs:

| Gate strength | When to use it | Shape |
|---|---|---|
| **Full critic loop** | The agent produces the deliverable itself (the writer) | draft → critique → revise, capped rounds (diagram in `01-orchestration.md` §5) |
| **Single-pass critic gate** | A parallel fan-out analyst (`01-orchestration.md` §4) feeding another agent | one critic call scored against that analyst's rubric; fails closed — flag or re-run once, don't silently pass a bad finding to the writer |

**Example of why the cheap gate still matters:** if `metrics_analyst` claims
"a huge spike" without a queried number — failing its own rubric row (table
above) — a single-pass gate on that analyst catches it before it ever
reaches the writer. Wait for the full writer/critic loop to catch it instead,
and you've paid for a whole draft built on a vague finding before anyone
notices.

This rubric table *is* explicit procedural memory (`02-memory.md` §1) —
"how to do the task, specifically," written down and versioned rather than
left implicit in a model's weights.

---

## 4. The Critic: Validating a Skill's Output Against Its Rubric

```python
from typing import Literal
from pydantic import BaseModel

# POSTMORTEM_RUBRIC: fetched from Langfuse prompt management
# (`01-orchestration.md` §3) — shown inline here only to keep the snippet
# self-contained.
POSTMORTEM_RUBRIC = [
    "Names a specific, evidence-cited root cause (not a vague guess)",
    "Impact is quantified (error rate, latency, blast radius — numbers)",
    "All required sections present: root cause, impact, timeline, actions",
    "Action items are concrete and assignable, not generic",
    "Tone is blameless — no individual named or blamed",
]

class CriticVerdict(BaseModel):
    verdict: Literal["APPROVE", "REVISE"]
    notes: str

# temperature=0 pinned — judge determinism, not just accuracy
CRITIC_MODEL = ChatModel(model=ANALYST_MODEL, temperature=0)
critic_structured = CRITIC_MODEL.with_structured_output(CriticVerdict)

# critic_node's return value feeds route_from_critic in 01-orchestration.md §5
def critic_node(state):
    verdict = critic_structured.invoke([
        SystemMessage(f"Score the draft against this rubric:\n{POSTMORTEM_RUBRIC}"),
        HumanMessage(state["draft"]),
    ])
    return {"critic_verdict": verdict}        # CriticVerdict — no string parsing
```

**Verdict is a schema, not free text.** `.startswith("APPROVE")` string
matching breaks the moment the critic's reply is reordered or padded.
**Example:** a critic reply of *"The draft looks solid — I'd say APPROVE,
though the timeline section could be tighter"* fails `.startswith("APPROVE")`
even though the verdict is clearly approve, because the sentence doesn't
open with that word. A `CriticVerdict` model with a
`Literal["APPROVE", "REVISE"]` field can't have this failure mode — the
verdict is a typed field, not a substring position — the same determinism
discipline `Send`-based routing already gets from LangGraph's conditional
edges (`01-orchestration.md` §2).

Pin `temperature=0` on every judge/critic role, not just this one — it's
necessary, though not sufficient, for a reproducible verdict: temperature=0
stabilizes the `verdict` field, but the `notes` field's exact wording can
still vary run to run, which is fine since nothing routes on `notes`. Route
only on the field you've actually pinned. For a critic gating something
before it's promoted past L1 autonomy (`design-considerations.md`), consider
running it N times and taking a majority vote (Anthropic's "voting" variant
of the parallelization pattern) instead of trusting a single pass.

The same shape — rubric constant, critic node, conditional edge — applies to
any subagent. Swap `POSTMORTEM_RUBRIC` for a `metrics_analyst`-scoped rubric
and the single-pass gate is the same code.

**This rubric is the same artifact `04-evaluation.md` §2 calls the
LLM-as-a-judge rubric.** Design it once here, use it twice: inline, as the
critic gating the live multi-agent system's output before it ships; offline,
as the judge scoring the same rubric in the CI eval harness. If the two
drift apart, you're grading the agent by a different bar in production than
in CI — keep them the same rubric, fetched from the same Langfuse
prompt-management key in both places.

---

## 5. Failure Mode: Worker Drift

| Symptom | Fix |
|---|---|
| An analyst answers a different question than asked | Sharp, single-responsibility system prompt per skill (§1) — and a rubric (§3) that would fail a drifted answer even if the prose sounds confident |

---

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

---

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
