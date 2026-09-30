# GTM — Go-to-Market

How Ockham is positioned, scored, sequenced, and launched. Built on the
**GTM-repository pattern** (The Revenue Architects' *GTM Starter Kit*): GTM
institutional knowledge as structured markdown an agent reads before every
task, so "research this account", "score this list", "build this campaign"
collapse to one-line prompts — and the outputs compound.

Company truth lives in [`../context-hub/`](../context-hub/). This folder is
the **sales-qualification and execution layer** on top of it — it never
restates context-hub, it references it. This is the single guide to
`ai-gtm/` — it replaces three previously-separate index files
(`README.md`, `how-to-run-gtm-agents.md`, `plays/README.md`); the last two
no longer exist.

Where this sits in the wider Ockham PDLC: `ai-pdlc-playbook.md` §8
(Release) — that doc has the Input/Working-Flow/Output contract for each of
the 4 plays in full; this one is the map and the day-to-day guide.

---

## 1. The map — every file, what it's for, when you'd touch it

**Who we sell to and how we talk:**

| File | Significance | When you touch it | Real or mimicked? |
|---|---|---|---|
| `icp-tiers.md` | ICP definition, tiers, anti-ICP, evolution log | Before scoring or researching any account | Real — Ockham's actual ICP, captured 2026-09-04. Confidence is "pre-launch hypothesis," not the data itself |
| `personas/` (3 profiles + README) | Who to reach — IT Director/CIO, security lead, VP Eng/SRE | Account research; writing any campaign touch | Real |
| `positioning-statement.md` | GTM's own positioning derivative | Before writing any copy | Real — derived from `../context-hub/positioning.md` |
| `messaging-by-persona.md` | Persona-specific messaging | Signal-to-sequence copy | Real — derived from `../messaging.md` |
| `battlecards/` (7 competitor files + README) | Competitive context, fixed-7 only | Account research; signal-to-sequence if a competitor's in play; competitor-switch playbook | Real, but **captured once (2026-09-04), no live refresh mechanism** — see Data Readiness |

**How we find and score them:**

| File | Significance | When you touch it | Real or mimicked? |
|---|---|---|---|
| `signal-library.md` | The signal catalogue, points, decay, suppression rules, Performance Log | Scoring any account; weekly (Performance Log) | Real signal definitions; Performance Log has one dummy row (§ Data Readiness) |
| `account-scoring.md` | The point-table model, hard gates, output format, Calibration Log | Scoring any account | Real model; Calibration Log has one dummy row |

**What actually runs — the 4 agents:**

| Agent | Significance | When you touch it |
|---|---|---|
| `.claude/agents/gtm-account-research.md` | Domain → intelligence brief + the angle | Before any Tier-1 outreach |
| `.claude/agents/gtm-account-scoring.md` | Account/list → score, tier, next action | Whenever an account needs qualifying |
| `.claude/agents/gtm-signal-to-sequence.md` | Signal + segment → a draft campaign | Building outreach for a Tier-2+ signal |
| `.claude/agents/gtm-weekly-update.md` | Keeps this whole folder from going stale | Every Monday |

Full contract for each (Input/Working-Flow/Output/Gate/Autonomy):
`ai-pdlc-playbook.md` §8.1–§8.4 and the agent files themselves.

**How the team decides what to do — human-facing, not agent-executed:**

| File | Significance | When you touch it | Real or mimicked? |
|---|---|---|---|
| `playbooks/` (6 files + README) | Trigger → which play(s) to chain → what to say → what not to do | The moment a signal fires, to decide the response | Real sales strategy, untested against real prospects yet |
| `workflows/` (3 files + README) | How the team runs GTM *infrastructure* — enrichment waterfall, signal routing, the full campaign-build process | Only relevant once building real outbound infra | Structure is real; vendor-specific parts (Clay/Apollo/a CRM/sending domains) don't exist yet |

**Archive and reference:**

| File | Significance | When you touch it | Real or mimicked? |
|---|---|---|---|
| `outputs/` | Dated archive of every real research/scoring/campaign run | After every real play run | Correctly empty today — nothing real has run yet |
| `examples/` (7 files + 1 campaign subfolder) | Fictional worked output of all 4 plays, so the model is legible with zero real data | Before you have real data, or to see the expected shape of an output | 100% mimicked, clearly marked |
| `pricing-and-packaging.md` | Strategy-level pricing/packaging, no commercial terms | ROI/business-case work, signal-to-sequence's Value framing | **Thin/unpopulated — a real gap**, tracked in `product-os/TODO.md` item 2 |
| `launch-plan.md` | The phased GTM launch plan (Ockham is at Phase 0) | Sizing what motion is even possible right now | Real strategic content; execution-dependent pieces (a real outbound motion) are correctly unpopulated pre-launch |

---

## 2. Trigger → playbook → plays — the actual chain

| Playbook | Trigger | Plays it chains, in order |
|---|---|---|
| **New signal response** (the general router — start here for any signal) | Any Tier-1/Tier-2 signal fires | Validate (manual, 5 min) → `gtm-account-scoring` → **Tier 1:** `gtm-account-research`, hand-written first touch, routed through the matching named playbook below if one applies → **Tier 2:** `gtm-signal-to-sequence` |
| Renewal / price shock | Observability renewal window, or a public price-increase reaction | `gtm-account-scoring` → `gtm-account-research` (targets IT Director/CIO) → pitch: single-platform TCO |
| Compliance deadline | A datable SOC 2 / DORA / HIPAA / audit window | `gtm-account-scoring` → persona-targeted outreach (IT Director + security lead) → pitch: evidence on the timeline |
| "Attack or outage?" | A public incident post-mortem showing time lost on attack-vs-outage triage | `gtm-account-scoring` → persona-targeted outreach (VP Eng/SRE) → pitch: the reconstruction half-hour |
| Cloud migration / K8s milestone | A Platform/EKS hire, a KubeCon talk, a migration case study | `gtm-account-scoring` → persona-targeted outreach (VP Eng, + security lead if combined with a security hire) → pitch: one-sensor thesis |
| Competitor switch | A fixed-7 competitor in the stack, named, reviewed negatively, or under contract | Pull the matching `battlecards/` file → one of 4 scenario responses (cold / active evaluation / negative review / under contract) — no fixed scoring/research step, it's scenario-dependent |

The four named-signal playbooks supply the **pitch**; `new-signal-response`
is what actually sequences the plays. `competitor-switch` runs on its own
trigger, parallel to the signal-library path.

---

## 3. Data readiness — what's missing vs. what's mimicked today

**Missing — blocks real use until it exists:**

| Gap | Blocks |
|---|---|
| Real closed-deal / design-partner pipeline data | `account-scoring.md`'s Calibration Log; `ai-launch-strategy.md`'s GTM Viability factor |
| Real campaign send/reply/meeting data | `signal-library.md`'s Performance Log |
| A connected enrichment tool (Clay/Apollo/G2 intent or similar) | `workflows/enrichment.md` |
| Real CRM + sending infrastructure (domains, deliverability) | `workflows/campaign-build.md`, `launch-plan.md` Phase 0 |
| Real pricing | `pricing-and-packaging.md` — tracked, `product-os/TODO.md` item 2 |
| Real named-customer VoC | The "Pain" assumptions in `icp-tiers.md`/`signal-library.md` — ties to `../ai-feedback/` + PRD stage 05 |
| Live competitive monitoring | `battlecards/` — captured once (2026-09-04), refreshed only by the `competitor-switch` playbook's "update within 24h of a win/loss" rule, which needs a real deal to trigger |

**Mimicked today — safe to use as-is, clearly marked, replace when real data exists:**

- `examples/` — fictional worked output for all 4 plays: a scored account list (with the two hard-gate exclusions), a full research brief, a complete campaign (brief + sequences + metrics + 3 weeks of results), a weekly-update log, a signal performance log.
- One dummy row each, now added directly into the real files so the agents have something concrete to read even in demo mode: `account-scoring.md`'s Calibration Log, `signal-library.md`'s Performance Log. Both tagged *(SAMPLE)* — delete on first real entry, don't leave them to be mistaken for data.

---

## 4. Who does what — human vs. agent

| | Human | Agent |
|---|---|---|
| **Running a play** | Decides which play(s) apply (reads the playbook), reviews the output | Executes research/scoring/drafting per its Autonomy note (§8.1–§8.4) |
| **Sending anything** | **Always** — no agent here has send capability, by design | Never |
| **Writing back to `ai-gtm/` files** | Confirms the diff (`gtm-weekly-update`'s built-in gate) | Drafts the diff, computes rates from real results |
| **Battlecards / ICP Evolution Log** | **Always drafts these** — competitive/market judgement an agent doesn't have | Only flags that one is stale, never drafts it |
| **Keeping this guide's Data Readiness table current** | Decides when something moves from "missing" to "real" — only a human knows a deal closed or pricing got set | Can flag staleness (same mechanism as weekly-update), never self-promotes a row from missing to real |
| **This reorganization itself** | One-time approval, already given | Built once, not a recurring task |

---

## Working rules

- One play / one campaign at a time. Run it, file the output, then the next.
- **Never commit** CRM data, contact lists, API keys, raw transcripts, or
  commercial terms (discounts, quotes).
- Every quantitative claim in an output carries a citation, same as `ai-prd/`.
- Honour `../context-hub/positioning.md` § Metric rules in all copy: frame
  time as **time-to-first-hypothesis**, never "in seconds"; "you can check
  its work"; competitor references only the fixed 7.
- Execution pieces (enrichment vendors, deliverability infra, live
  performance logs, `sync/` automation) are **structure now, populated once
  there's a real outbound motion** — Ockham is pre-launch.

---

## How it connects

- **Upstream:** [`../context-hub/`](../context-hub/) (positioning, ICP,
  competitors, metric rules), [`../ai-product-strategy/`](../ai-product-strategy/)
  (horizon), [`../data-analysis/`](../data-analysis/) (market sizing,
  pricing data), [`../messaging.md`](../messaging.md) — the 5-second hero
  copy is the **copy standard for every sequence**.
  *(`ai-product-strategy/` and `data-analysis/` are README-only scaffolds
  today — `ai-gtm/` runs without them.)*
- **Reuses [`../ai-feedback/`](../ai-feedback/):** the behavioural/intent
  signal class runs through `signal-scan`, not a second detector;
  `pattern-classification` calibrates which pains are real.
- **Feeds [`../ai-launch-strategy.md`](../ai-launch-strategy.md):**
  `battlecards/` → the Competition lens; `launch-plan.md` + the
  design-partner pipeline → the GTM Viability lens. **Do not scale outbound
  spend while GTM Viability is Red.**
- **Not the same as [`../ai-discovery/`](../ai-discovery/):** discovery's
  `opportunity-scorecard.md` scores a *product opportunity*;
  `account-scoring.md` scores a *prospect account*. Same shape, different
  object — keep separate.

---

## Status

Structure built 2026-09-04, populated with Ockham's ICP, signals, personas,
and battlecards. Reorganized 2026-09-30 (folded 3 index files into this one,
deleted the now-redundant `plays/` folder, fixed 23 dangling references left
over from moving the play agents to `.claude/agents/`, added one dummy
Calibration-Log and one dummy Performance-Log row so the agents have
something concrete to read pre-launch). Signal points and message hooks are
still **pre-launch hypotheses** — replace with measured reply/meeting rates
after the first 3–4 real campaigns. Folds into `lifecycle/release/` when
`lifecycle/` is built.
