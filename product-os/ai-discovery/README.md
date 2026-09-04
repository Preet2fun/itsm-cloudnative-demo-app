# AI Discovery — Discovery Agent

One agent that decides whether an idea deserves a PRD. It takes a raw idea or a
signal, sizes the opportunity, tests whether there's a real AI-native angle,
researches the problem space, **diverges and converges on solution shapes**,
maps the risky assumptions, and ends with a **Pursue / Park / Kill** call. On
**Pursue** it writes a **Discovery Brief** (validated problem + candidate
solutions) that becomes the [`../ai-prd/`](../ai-prd/) PRD Agent's stage-01 input.

Discovery is deliberately cheap and short. Its value is killing weak ideas
*before* a PRD is spent on them — a confident Kill is a good outcome.

- **[`discovery-agent.md`](discovery-agent.md)** — the agent: role, the 6-stage
  loop, the Pursue / Park / Kill decision.

## Supporting files

| File | What it is |
|---|---|
| [`opportunity-scorecard.md`](opportunity-scorecard.md) | The five-factor opportunity score + the AI-native gate + the Ockham-fit gates (stage 02) |
| [`research-methods.md`](research-methods.md) | The problem-space toolkit: signal synthesis, JTBD, current-state journey, evidence-gap list (stage 03) |
| [`discovery-brief.md`](discovery-brief.md) | The output template — the Pursue handoff to the PRD Agent (and the Park / Kill decision log) |
| [`stages/`](stages/) | One file per stage of the loop (01–06) |

## How to run

Point an agent at `discovery-agent.md`, give it the idea or signal, and give it
read access to `../context-hub/`, `../ai-product-strategy/`, `../knowledge-hub/`,
and any research sources (interviews, tickets, usage, churn). It works through
`stages/01 … 06` and writes the decision.

## Where discovery work lands

```
product-os/ai-discovery/discovery/<idea-slug>/
├── stages/01-idea-intake.md … 06-decision-and-brief.md
├── signals/            # raw research pulled in during stages 03–05
└── discovery-brief.md  # on Pursue  (or decision-log.md on Park / Kill)
```

`<idea-slug>` carries forward: on **Pursue**, the PRD Agent reuses the same slug
for `../ai-prd/prds/<slug>/`, so a feature's discovery and PRD trails share one
name.

## Upstream / downstream

Upstream: [`../context-hub/`](../context-hub/) (ICP, positioning, the fixed
competitor set, metric rules, agentic use cases, moat),
[`../ai-product-strategy/`](../ai-product-strategy/) (the current horizon),
[`../knowledge-hub/`](../knowledge-hub/) (does it already exist?).
Downstream: [`../ai-prd/`](../ai-prd/) — a **Pursue** hands its Discovery Brief
in as PRD stage 01. Park / Kill decisions and recurring signals feed
`../ai-product-strategy/`.

When `lifecycle/` is built, `ai-discovery/` + `ai-prd/` both fold into
`lifecycle/discovery/` — discovery is the front half, the PRD is the back half.

## Sources this was built from

- productmanagement.ai — *PMF for AI Products*: the **Discover** phase, the
  five-question opportunity ranking (magnitude / frequency / severity /
  competition / contrast, each with an AI angle), "invisible pain points", and
  the core warning — *the biggest mistake is adding AI on top of an existing
  workflow*.
- Continuous-discovery practice — jobs-to-be-done, current-state journey
  mapping, assumption mapping and riskiest-assumption tests, solution
  divergence / convergence (impact × feasibility).
- **Product Faculty — AI PRD Template** (4D "Discover" phase): the three Value
  Maps (Business / Feature / User) and the **Diverge → Converge** AI Solution
  Hypothesis step (stage 04). The Value Maps are answered once in the hubs (see
  `../context-hub/README.md` and `../knowledge-hub/README.md`), not per idea.
- carlvellotti *free-ai-courses* `2.1-write-prd` — Socratic sharpening, research
  synthesis, partner-not-ghostwriter.
- Ockham `context-hub/` — ICP + disqualifiers, positioning wedge, the fixed 7
  competitors, the moat thesis, the metric rules.
