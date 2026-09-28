# Campaign Brief: Observability Renewal / Price Shock — Tier 1

> **SAMPLE DATA — fictional campaign, illustrative numbers.**

Created: 2026-08-18 · Owner: founder · Status: **Live — launched 2026-08-18**
Play: [`../../plays/signal-to-sequence.md`](../../plays/signal-to-sequence.md) ·
Playbook: [`../../playbooks/renewal-price-shock.md`](../../playbooks/renewal-price-shock.md)

---

## Trigger logic

**Signal:** *Observability renewal / price shock*
([`../../signal-library.md`](../../signal-library.md)) — a Datadog / New Relic /
Splunk renewal in the next 1–2 quarters, **or** a public reaction to an incumbent
price increase.

**Activation:** signal fired in the last 45 days · account ICP score ≥ 60 · a
renewal window datable within ~1 quarter.

**Suppression:** existing customer / design partner · active opportunity ·
contacted in last 45 days · any disqualifier (SOC + SIEM, majority on-prem,
Azure/GCP-first, 5,000+).

**Estimated list:** 12 accounts on 2026-08-18; refreshed weekly, +2–4/week as
renewal-window and price-complaint signals surface.

---

## Target audience

- **Tiers:** 1 and 2 (Tier-1 accounts get hand-personalised touches 1–3; Tier-2
  get the semi-personalised variant).
- **Firmographic:** 100–1,000 employees, AWS + Kubernetes, no SOC.
- **Persona:** IT Director / Head of Infrastructure / CIO
  ([`../../personas/it-director-cio.md`](../../personas/it-director-cio.md));
  technical evaluator added on a second thread once the buyer engages.
- **Named Tier-1 anchor:** Meridian Freight
  ([`../2026-08-14-research-meridian-freight.md`](../2026-08-14-research-meridian-freight.md)).

**Why the renewal window (not just "uses Datadog"):** using Datadog is a
technographic fit, not a trigger. The *renewal* is the only moment the contract
is re-openable, and the ICP buyer has no separate security budget to absorb the
increase — the unified-budget wedge is at maximum leverage for ~10 weeks, then
it's gone.

---

## Sequence structure

| Touch | Day | Channel | Goal | Personalisation |
|---|---|---|---|---|
| 1 | 0 | Email | Renewal-timing hook + the "you're adding security anyway" insight | **High** (Tier 1: hand-written) |
| 2 | 3 | LinkedIn | Connect, one-line context referencing the email | Medium |
| 3 | 6 | Email | The TCO breakdown (one bill vs. APM + emerging security spend) | Medium–High |
| 4 | 11 | Email | POC offer — time-to-first-hypothesis on a replayed past incident | Low |
| 5 | 16 | Phone / VM | Direct, low-key | Medium |
| 6 | 23 | Email | Break-up + "reach out when the renewal is closer" | Low |

Tier-2 variant: drop touch 5, templatise touches 1 and 3 with a `{{incumbent}}`
and `{{renewal_month}}` variable.

---

## Success targets

| Metric | Tier 1 target | Tier 2 target |
|---|---|---|
| Open rate | > 55% | > 45% |
| Reply rate | > 10% | > 5% |
| Meeting rate | > 5% | > 2.5% |
| POCs started per 10 accounts | ≥ 2 | ≥ 1 |

Baseline (no signal, generic outreach to the same persona): ~2% reply, ~0.8%
meeting.

**Review:** week 2 (patterns), week 6 (continue / iterate / retire).
