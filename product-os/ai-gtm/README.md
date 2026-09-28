# GTM — Go-to-Market

How Ockham is positioned, scored, sequenced, and launched. Built on the
**GTM-repository pattern** (The Revenue Architects' *GTM Starter Kit*): GTM
institutional knowledge as structured markdown an agent reads before every task,
so "research this account", "score this list", "build this campaign" collapse to
one-line prompts — and the outputs compound.

Company truth lives in [`../context-hub/`](../context-hub/). This folder is the
**sales-qualification and execution layer** on top of it — it never restates
context-hub, it references it.

---

## The layers

| Layer | File(s) | What it is |
|---|---|---|
| **Index** | `README.md` (this file) | Scannable in 2 minutes. Points to everything else. |
| **Context** | `icp-tiers.md` · `signal-library.md` · `account-scoring.md` · `positioning-statement.md` · `messaging-by-persona.md` · `personas/` · `battlecards/` | The GTM knowledge base. Dated; carries evolution + performance logs. |
| **Plays** | [`plays/`](plays/) | What an agent executes — one prompt, one output. |
| **Workflows** | [`workflows/`](workflows/) | How the team operates — decision trees for humans, not agent instructions. |
| **Playbooks** | [`playbooks/`](playbooks/) | Step-by-step for one situation. Ockham's four sales plays + two from the kit. |
| **Outputs** | [`outputs/`](outputs/) | Dated archive of every brief, campaign, and scoring run. The feedback loop. |
| **Examples** | [`examples/`](examples/) | **Sample data** — fictional prospect accounts + worked scoring / research / campaign, so the model is legible before real data exists. Replace once the AI feature generates real signals. |

Plus `pricing-and-packaging.md` (strategy, no commercial terms) and `launch-plan.md`.

---

## Quick reference

**ICP in one line:** midsize (100–1,000 employees), IT org 20–80, **no dedicated
SOC**, AWS + Kubernetes in production, one team owns uptime *and* security,
economic buyer = IT Director / CIO. Full tiers + anti-ICP: [`icp-tiers.md`](icp-tiers.md).

**Top signals — act immediately:** observability renewal or price shock ·
a compliance deadline (SOC 2 / DORA / audit) · a public incident where
"attack or outage?" took hours · a Kubernetes / cloud-migration milestone ·
a first security-engineer hire into an IT team with no SOC. Full library +
scoring + decay: [`signal-library.md`](signal-library.md).

**The plays:**
```
Read gtm/plays/account-research.md and research <company.com>
Read gtm/plays/account-scoring.md and score: <list>
Read gtm/plays/signal-to-sequence.md — build a Tier 2 campaign for <signal>, persona <role>
Read gtm/plays/weekly-update.md and run the weekly GTM update
```

---

## How it connects

- **Upstream:** [`../context-hub/`](../context-hub/) (positioning, ICP,
  competitors, metric rules), [`../ai-product-strategy/`](../ai-product-strategy/)
  (horizon), [`../data-analysis/`](../data-analysis/) (market sizing, pricing
  data), [`../messaging.md`](../messaging.md) — the 5-second hero copy is the
  **copy standard for every sequence**.
  *(`ai-product-strategy/` and `data-analysis/` are README-only scaffolds today —
  `gtm/` runs without them; `pricing-and-packaging.md` and the `launch-plan.md`
  targets stay thin until they're populated.)*
- **Reuses [`../ai-feedback/`](../ai-feedback/):** the behavioural / intent
  signal class (what the market is saying) runs through `signal-scan` — not a
  second detector. `pattern-classification` calibrates which pains are real.
- **Feeds [`../ai-launch-strategy.md`](../ai-launch-strategy.md):** `battlecards/`
  → the Competition lens; `launch-plan.md` + the design-partner pipeline → the
  GTM Viability lens. **Do not scale outbound spend while GTM Viability is Red.**
- **Not the same as [`../ai-discovery/`](../ai-discovery/):** discovery's
  `opportunity-scorecard.md` scores a *product opportunity*; `account-scoring.md`
  scores a *prospect account*. Same shape, different object — keep separate.

---

## Working rules

- One play / one campaign at a time. Run it, file the output, then the next.
- **Never commit** CRM data, contact lists, API keys, raw transcripts, or
  commercial terms (discounts, quotes).
- Every quantitative claim in an output carries a citation, same as `ai-prd/`.
- Honour `context-hub/positioning.md` § Metric rules in all copy: frame time as
  **time-to-first-hypothesis**, never "in seconds"; "you can check its work";
  competitor references only the fixed 7.
- Execution pieces (enrichment vendors, deliverability infra, live performance
  logs, `sync/` automation) are **structure now, populated once there's a real
  outbound motion** — Ockham is pre-launch.

---

## Status

Structure built 2026-09-04, populated with Ockham's ICP, signals, personas, and
battlecards. Signal points and message hooks are **pre-launch hypotheses** —
replace with measured reply/meeting rates after the first 3–4 campaigns. Folds
into `lifecycle/release/` when `lifecycle/` is built.
