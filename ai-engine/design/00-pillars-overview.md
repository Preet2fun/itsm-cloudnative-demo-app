# Agentic AI System — 5 Pillars Overview

The umbrella framework under `ai-engine/design/` — the entry point for the
other five pillar files (`01-orchestration.md` through
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

---

## 2. The 5 Pillars

| # | Pillar | What it covers | Full depth |
|---|---|---|---|
| 1 | **Orchestration** | The decision loop and multi-agent control flow | `01-orchestration.md` |
| 2 | **Memory** | What an agent remembers, and when it's allowed to write | `02-memory.md` |
| 3 | **Tools** | How an agent reaches outside itself (grounding) | `03-tools.md` |
| 4 | **Evaluation** | How you verify an agent actually works | `04-evaluation.md` |
| 5 | **Agent Skills** | Packaged, guardrailed, reusable behaviors | `05-agent-skills.md` |

---

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

---

## 4. The 6-Step Build Journey

A practical roadmap from concept to production — walked end-to-end below
using the same SRE incident-investigation multi-agent system that runs
through the other pillar files, so each step lands on a concrete,
already-designed piece.

```
1 Define ──▶ 2 Design SOP ──▶ 3 Build MVP ──▶ 4 Connect & Orchestrate ──▶ 5 Test & Iterate ──▶ 6 Deploy & Monitor
```

### Step 1 — Define: the Smart Intern Test

**Could a smart intern do this with clear instructions?** Yes → good agent
candidate. No → too complex, break it down further.

**Applied:** "Given `logs.txt`, `metrics.json`, and `deploy_log.txt`, could a
smart intern draft a postmortem naming a root cause?" — yes, this is exactly
why the multi-agent system is a set of narrow, single-responsibility analysts
(`01-orchestration.md` §3) rather than one broad agent asked to "diagnose and
fix any incident," which fails the test.

### Step 2 — Design the SOP

Write the step-by-step procedure a human would follow; identify decision
points, data needs, and tools required; define clear success criteria.

**This SOP is where the rubric comes from.** The per-agent rubrics in
`05-agent-skills.md` §3 (`logs_analyst` cites line numbers; `writer` needs a
quantified impact and a blameless tone) are the SOP's success criteria,
written down first — not invented independently of it.

### Step 3 — Build the MVP

Start with **one** high-leverage reasoning task, manual inputs (no
integrations yet), and test with Step 1's examples.

**Applied:** prove root-cause identification on a pasted log excerpt before
wiring any live MCP tool. "Test with Step 1's examples" is exactly
`04-evaluation.md` Phase 1 — write the dataset before the graph exists.

**Red flags at this stage:**

| Red flag | Meaning | Applied |
|---|---|---|
| Can't define concrete examples | Scope is too broad | "Investigate any incident" vs. "draft a postmortem from a checkout-service error-rate spike" |
| Traditional software would work better | Don't use agents here | A static SLO threshold alert doesn't need an LLM wrapped around it |
| Connecting to APIs that don't exist yet | Build on manual/pasted inputs first | Live MCP wiring is Step 4, not Step 3 |

**Get core reasoning right before adding complexity.**

### Step 4 — Connect & Orchestrate

Identify data needs (observability APIs, CMDB, vector DB), build connection
logic via MCP (Pillar 3), decide orchestration complexity.

**Deciding orchestration complexity isn't a vibe — use three triggers**
(Anthropic, "When to use multi-agent systems, and when not to"): **context
protection** (one subtask's detail would pollute another's reasoning),
**parallelization** (genuinely independent, decomposable work), and
**specialization** (conflicting tool sets or domain expertise per subtask).
Multi-agent typically costs 3–10× more tokens than a single agent, so it's
justified only when the benefit clears that cost — start with the simplest
approach that works.

**Applied:** the SRE incident-investigation multi-agent system qualifies on
all three — logs, metrics, deploy history, and a dashboard screenshot are
irrelevant to each other (context protection), independently gatherable
(parallelization), and genuinely different domains (specialization) —
`01-orchestration.md` §2's pattern choice, composed fully in
`01-orchestration.md` §7. **Contrast:** a Security agent that only assigns a
severity label to an incoming alert — one classification call against one
alert payload — triggers none of the three and should stay a single agent;
wrapping it in a supervisor+workers graph would add the 3–10× cost for no
benefit.

### Step 5 — Test & Iterate

Start manual: test examples, trace decisions in Langfuse. Scale with
automation: eval datasets. Define success metrics.

**Applied:** this is `04-evaluation.md`'s testing pyramid and phased
lifecycle (§3–§4 there) — this step doesn't get its own new mechanics, it's
where that doc's machinery turns on.

### Step 6 — Deploy & Monitor

Deploy with a limited user group first; monitor cost, latency, accuracy;
remember real usage ≠ expected usage.

**Applied:** "limited group first" is Autonomy Levels L0/L1 as the default
starting point (`design-considerations.md` — "never assign L3/L4 by
default"). Monitoring is the live Langfuse dashboard (`04-evaluation.md`
Phase 6). "Real usage ≠ expected usage" is exactly why Phase 7's continuous
feedback loop exists — production always surfaces cases the offline dataset
didn't anticipate.

---

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

---

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

---

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
