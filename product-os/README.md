# Product OS — Ockham

The **product side** of Ockham's *Product Development Lifecycle Ecosystem*. The
engineering repo (`platform-app/`, `customer-app/`, `ai-engine/`) is the "how";
this is the "what and why" that feeds it.

Built step by step, under direction. No speculative content, no offline research
unless asked. [`context-hub/`](context-hub/) is upstream of everything —
downstream docs don't silently contradict it.
[`ai-pmf-strategy.md`](ai-pmf-strategy.md) is the AI-PMF framework the modules
are built on (opportunity → 4D build → scale-when-green → compound);
[`ai-launch-strategy.md`](ai-launch-strategy.md) is its Phase 3 as a working
gate — the AI Launch Strategy Canvas and the scale-or-hold call.

> Not the engineering roadmap. Delivery status lives in the GitHub Project
> (root `CLAUDE.md` §11).

---

## The ecosystem

The full lifecycle runs **Discovery → Operations**, each phase driven by an
agent that produces defined artifacts, all sitting on shared frameworks and
stores. Only part of this lives under `product-os/`:

| Layer | Blocks | Home |
|---|---|---|
| **Lifecycle — product phases** | Discovery, Design, Planning, Release, Operations | `product-os/lifecycle/` &nbsp;·&nbsp; *planned* |
| **Lifecycle — engineering phases** | Development, Quality Assurance, Deployment | engineering repo |
| **AI PDLC** | governed framework · eval framework (product-side) | `product-os/ai-pdlc/` &nbsp;·&nbsp; *planned* |
| **Knowledge stores** | Knowledge Hub · Context Hub | `product-os/` &nbsp;·&nbsp; **built** |
| **Central Skills Repo** | Skills · Rules · Commands · Agents · Plugins (`#ai-builder-artifacts`) | engineering / tooling |
| **Central MCP-Gateway** | unified tool & resource access | engineering / tooling |

### Lifecycle phases (reference)

| Phase | Owner | Agent | Key artifacts |
|---|---|---|---|
| Discovery | PM · TA | Product Discovery Agent | PRD, Figma specs, prototype |
| Design | Designer · TA · PM | Design · Test · Ally Agent | HLD, LLD, feature spec, mocks |
| Planning | PM · Team | Planning Agent | JIRA tickets, sprint plan |
| Development | Team | Dev · Test Agent | pull request, automation, test reports |
| Quality Assurance | QE | QE Agent | user-journey automation, test reports |
| Deployment | T&O | Deployment Agent | deployed build, prod test reports |
| Release | PM · PMM · TW | Release · Doc Agent | solution articles, GTM materials |
| Operations | PM · Team | Support · Ops · SRE Agent | triage report, pull request |

---

## Current structure

```
product-os/
├── context-hub/          company context — SEEDED (6 docs)
├── knowledge-hub/        shipped features + how they work — empty, purpose defined
├── ai-discovery/         Discovery Agent (idea → Pursue/Park/Kill) — BUILT
├── ai-prd/               PRD Agent + PRD Reviewer Agent — BUILT
├── ai-feedback/          Customer Feedback Intelligence (MCP or CSV) — BUILT
├── gtm/                  Go-to-market — GTM-repository pattern (+ sample data) — BUILT
├── ai-product-strategy/  standalone scaffold ┐
├── ai-design/            standalone scaffold ┤ each folds into a lifecycle/
└── data-analysis/        standalone scaffold ┘ phase once that is built
```

Root docs: [`ai-pmf-strategy.md`](ai-pmf-strategy.md) ·
[`ai-launch-strategy.md`](ai-launch-strategy.md) — cross-cutting frameworks;
[`messaging.md`](messaging.md) — the homepage & product message (5-second test).
The BUILT standalone folders (`ai-discovery/`, `ai-prd/`, `ai-feedback/`, `gtm/`)
also fold into `lifecycle/` — see "Standalone folders" below.

### The two hubs

| Hub | Holds | Feeds |
|---|---|---|
| [`context-hub/`](context-hub/) | **Company context** — thesis, category, vision, positioning, ICP, competitive landscape, agentic use cases, technical theses | Everything |
| [`knowledge-hub/`](knowledge-hub/) | **Shipped product features and how they work** — feature-by-feature, with dependencies. The reference for writing the next PRD / design without breaking what exists | Discovery, Design |

Both are persistent stores that outlive any single phase.

### Standalone folders

`ai-discovery/`, `ai-prd/`, `ai-feedback/`, `ai-product-strategy/`, `ai-design/`,
`gtm/`, `data-analysis/` are standalone **only until `lifecycle/` is built** —
then each folds into the matching phase:

| Folder | Folds into |
|---|---|
| `ai-discovery/` — **Discovery Agent** (idea → Pursue / Park / Kill → Discovery Brief) | `lifecycle/discovery/` (front half) |
| `ai-prd/` — **PRD Agent + PRD Reviewer Agent** | `lifecycle/discovery/` (back half) |
| `ai-feedback/` — **Customer Feedback Intelligence** (MCP tool or CSV → cited VoC evidence) | shared capability feeding `lifecycle/discovery/`, `planning/`, `release/` |
| `ai-design/` | `lifecycle/design/` |
| `gtm/` — **ICP tiers · signal library · account scoring · plays · battlecards · playbooks** (GTM-repository pattern) | `lifecycle/release/` |
| `ai-product-strategy/` | feeds `lifecycle/discovery/` + `lifecycle/planning/` across phases |
| `data-analysis/` | feeds every phase (quantitative half; `ai-feedback/` is the qualitative half) |

Chain: **`ai-discovery/` Pursue → Discovery Brief → `ai-prd/` stage 01 → PRD.**

Until then they keep their own READMEs and current scope.

---

## Planned next (not built yet)

- `lifecycle/` — `discovery/`, `design/`, `planning/`, `release/`, `operations/`
  (absorbs the standalone folders per the table above)
- `ai-pdlc/` — product-side governed framework + eval framework. Distinct from
  `ai-engine/`'s CI-gated evals (`ai-engine/CLAUDE.md`) — this is the product
  layer's own governance, not the engine's.

Added one at a time, as each is started.

## Working rules

1. **Directed, not autonomous.** Folders are built when asked, in the order asked.
2. **No offline research** unless explicitly requested.
3. **`context-hub/` is upstream of everything.** A downstream doc that contradicts
   it is wrong, or the hub gets updated deliberately — not silently.
4. Every folder has a `README.md` stating what belongs there and its current state.
