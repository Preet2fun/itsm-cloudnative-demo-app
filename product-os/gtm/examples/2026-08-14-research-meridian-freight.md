# Account Research: Meridian Freight

> **SAMPLE DATA — fictional account, invented people and numbers.**

Date: 2026-08-14 · Researched by: Claude (`plays/account-research.md`)
Signal score: 95/100 · Tier: 1 · **Recommended action: immediate outreach
(founder-led), within 48 h**

---

## Company snapshot

Meridian Freight sells a real-time visibility and exception-management platform to
mid-market freight brokers and 3PLs. ~320 employees, HQ Chicago. Series C ($40M,
Dec 2025) to fund a European launch and an ML-based ETA product — which is
driving a fast infrastructure build-out.

## Funding & growth

- Last round: $40M Series C, Dec 2025, led by (fictional) Halyard Ventures.
- Headcount: ~320, up from ~210 twelve months ago (+52%). Engineering ~95.
- Key recent hires (last 90 days): 2 Platform Engineers, a Staff SRE-titled role
  (but no SRE *team* — sits inside Platform), a "Vendor Manager – Observability &
  Tooling" (posted 12 days ago — **the renewal signal**).

## Tech stack

- Cloud: AWS, primary compute on **EKS** (migrated off ECS ~14 months ago).
- Observability: **Datadog** (APM + logs + infra) — contract renews ~late Oct.
- Security: AWS GuardDuty + Snyk (SCA). No SIEM. No dedicated security hire.
- **4 tools** across monitoring / logging / posture / SCA → tool-sprawl signal.
- Integration opportunity: single eBPF sensor replaces the Datadog agent *and*
  gives runtime security GuardDuty doesn't. Displacement target: Datadog.

## Stakeholder map

| Name | Title | Tenure | Reach via | Notes |
|---|---|---|---|---|
| Dev Nakamura | Director of IT & Platform | 2.5 yrs | Email + LinkedIn | **Economic buyer.** Owns uptime *and* security; controls the tooling budget. Posts occasionally about on-call load. |
| Sasha Lindqvist | Staff Engineer, Platform | 7 mos | LinkedIn / community Slack | **Technical evaluator.** Ex-Datadog-heavy shop; would run the POC. Spoke at a regional K8s meetup in June. |
| Marcus Bell | VP Engineering | 1.5 yrs | Via Dev / warm intro | Approves spend above a threshold; cares about the Europe launch timeline. |

## Active signals

| Signal | Status | Fired | Score contribution |
|---|---|---|---|
| Observability renewal / price shock | Active | ~12 days ago (job post); renewal ~10 weeks out | +35 |
| Tool sprawl (4 tools) | Active | ongoing | +18 |
| Combination: price shock + tool sprawl | Active | — | +12 |
| *(capped at 30 for the model)* | | | **30** |

## Competitive context

Datadog incumbent — see [`../battlecards/datadog.md`](../battlecards/datadog.md).
The Vendor Manager hire + a Series-C burn-rate focus suggests a cost review is
underway. No evidence of an active alternative evaluation yet — the window is
*before* they shortlist. Not a product-vs-product fight; the frame is **one bill
replacing an APM bill plus the security spend they'll add for Europe (GDPR /
customer questionnaires)**.

## The angle

- **Why now:** Datadog renews in ~10 weeks and they just hired a Vendor Manager
  to run tooling cost. The contract is briefly re-openable.
- **Why us:** one eBPF sensor covers the EKS estate for *both* monitoring and
  runtime security — so the Europe-launch security requirements don't become a
  second vendor and a second line item.
- **The hook:** *(passes PVP — an insight, useful even if they never buy)*
  > "The Vendor-Manager-for-tooling hire usually shows up right before a
  > renewal, and for teams your size the Datadog number is going one way. The
  > part most people miss in that review: you're about to add a security line
  > item for the Europe launch anyway. Worth pricing one platform for both
  > before you re-sign — happy to send the TCO breakdown either way."
- **Who sends:** founder → Dev Nakamura, email, LinkedIn follow-up. Sasha gets a
  separate technical thread once Dev engages.

## Suggested next action

Enrol in the **Observability renewal / price shock — Tier 1** campaign
([`campaign-renewal-price-shock-tier1/`](campaign-renewal-price-shock-tier1/));
touches 1–3 hand-personalised per this brief. Offer a POC scoped to finish
before the late-Oct renewal, measuring time-to-first-hypothesis on a replayed
past incident.
