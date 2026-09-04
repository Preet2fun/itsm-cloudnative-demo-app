# AI PRD — PRD Agent & PRD Reviewer Agent

Two agents that produce evidence-grounded, AI-native PRDs for Ockham, plus the
format and rubric they run against. Built once, reused for every feature.

- **[`prd-agent.md`](prd-agent.md)** — drafts a full PRD from a one-line brief by
  running a 12-stage sequential loop, hunting evidence at each stage, and
  grounding every claim in a citation.
- **[`prd-reviewer-agent.md`](prd-reviewer-agent.md)** — the pre-human "CPO
  check", built on **Uber's AI PRD Evaluator**: assembles 360° context,
  classifies the PRD by risk tier, scores it across seven dimensions (Uber's six
  + an AI-readiness dimension), and returns a **Ready / Ready with Caveats /
  Not Ready** scorecard with write-ready fixes.

## Supporting files

| File | What it is |
|---|---|
| [`prd-template.md`](prd-template.md) | The canonical PRD structure — header, review block, sections 1–17, AI-native addendum |
| [`review-rubric.md`](review-rubric.md) | The reviewer's 4 tiers, 7 dimensions (Uber's 6 + AI-readiness) with checks, launch-readiness gates, scorecard shape |
| [`citations.md`](citations.md) | Citation tags and the evidence-honesty rule (Measured / Assumed / Gated) |
| [`stages/`](stages/) | One file per stage of the drafting loop (01–12) |

## How to run

**Draft** — point an agent at `prd-agent.md`, give it the feature brief, and give
it read access to `../context-hub/`, `../knowledge-hub/`, and any analytics /
data / research sources. It works through `stages/01 … 12`, writing each stage
artifact, then assembles `prd.md`.

**Review** — `prd-agent.md` calls `prd-reviewer-agent.md` automatically at
stage 11. To review an existing PRD on its own, point an agent at
`prd-reviewer-agent.md` and the `prd.md` path.

Both are tool-agnostic (Claude Code, Cursor, …). To expose them as slash
commands, add thin `.claude/commands/write-prd.md` / `review-prd.md` wrappers
that read these files — not done here, to keep the Product OS tool-neutral.

## Where PRDs land

```
product-os/ai-prd/prds/<feature-slug>/
├── stages/            # 01-idea-brief.md … 12-final-checklist.md
├── context/           # briefs, linked docs, raw research pulled in
├── prototype/         # Claude Design drafts / prototype notes
└── prd.md             # the assembled PRD
```

`<feature-slug>` is the **same slug** the Discovery Brief used
(`../ai-discovery/discovery/<slug>/`) — a feature's discovery and PRD trails
share one name.

## Upstream / downstream

Upstream: [`../ai-discovery/`](../ai-discovery/) (the Discovery Brief that
becomes stage-01 input), [`../context-hub/`](../context-hub/) (company context,
positioning, ICP, competitors, metric rules),
[`../knowledge-hub/`](../knowledge-hub/) (shipped features + dependencies),
[`../ai-product-strategy/`](../ai-product-strategy/).
Downstream: [`../ai-design/`](../ai-design/), engineering.
When `lifecycle/` is built, this folder becomes the back half of
`lifecycle/discovery/` (front half = [`../ai-discovery/`](../ai-discovery/)).

## Sources this was built from

- carlvellotti *free-ai-courses* — `cursor-pm-course/.../2.1-write-prd`:
  partner-not-ghostwriter loop, Socratic framework, engineer / executive /
  user-researcher reviewer personas.
- *ContractIQ* PRD (`sachin0034-tech/dev-os`) — the AI-native PRD format:
  grounding, prompt strategy, hallucination guardrails, eval strategy, HHH,
  agent-autonomy table, per-component ML-necessity check.
- productmanagement.ai — *PMF for AI Products*: AI-native vs feature-bolt-on, the
  4D method, dual metrics, trust compounding, probabilistic vs deterministic.
- phuryn *pm-skills* — `write-prd` command: opinionated scope, specific metrics,
  genuine open questions.
- Uber — *Lessons from Building a First-Pass AI PRD Reviewer* (Uber Engineering,
  May 2026): the reviewer's spine — 360° context assembly, four risk tiers, six
  review dimensions (Opportunity & Hypothesis, Product Scope, User Experience &
  Impact, Metric & Data Rigor, Adjacent Impact, Prior Learnings), and the
  action-oriented scorecard (launch-readiness rating; Looks Good / Needs Review
  per dimension; Critical Requirements vs Optimizations with a "start here").
- **PRD Genie** architecture (the screenshots) — 12-stage sequential
  intelligence loop, the "CPO check", the `stages/` + `prd.md` layout.
  **Used as the tie-breaker where sources disagree.**
