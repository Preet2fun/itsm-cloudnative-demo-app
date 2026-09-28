# ICP Tiers — Sales Qualification

The sales-qualification view of [`../context-hub/icp.md`](../context-hub/icp.md):
tiers, anti-ICP, and a qualification framework you can run in a discovery call.
`context-hub/icp.md` is the canonical definition — this file derives from it and
never contradicts it.

Last updated: 2026-09-04

---

## The one-sentence ICP

Midsize enterprise (**100–1,000 employees**, under ~$1B revenue), **IT org of
20–80**, **no dedicated SOC**, **AWS + Kubernetes in production**, where **one
team owns uptime and security** on one budget, and the economic buyer is an
**IT Director / Head of Infrastructure / CIO** — not a CISO.

---

## Tiers

### Tier 1 — Design-partner / dream accounts

Perfect firmographic + technographic + organizational fit **and ≥1 Tier-1
behavioural signal active** ([`signal-library.md`](signal-library.md)).

- **Criteria:** all four qualification must-haves (below) + a live renewal,
  compliance deadline, "attack-or-outage" incident, K8s milestone, or first
  security hire.
- **Approach:** founder / AE-led, fully researched, design-partner framing
  (co-build, reference logo, pricing latitude). Run
  [`plays/account-research.md`](plays/account-research.md) before any touch.

### Tier 2 — High-fit, signal-triggered

Full ICP fit, no Tier-1 signal yet — or a Tier-2 signal (tool sprawl, outgrown
AWS-native security, a consolidation post).

- **Approach:** signal-triggered, semi-personalised sequences via
  [`plays/signal-to-sequence.md`](plays/signal-to-sequence.md); an SDR reviews
  touch 1.

### Tier 3 — Good-fit, automated

Meets the minimum: cloud-native on AWS, Kubernetes in production, 100–1,000
employees, plausibly no SOC — but fit is unconfirmed or thin.

- **Approach:** automated light-touch nurture; templated with a signal variable.

### Tier 4 — Monitor only

Adjacent — slightly large, SOC status unknown, Azure with some AWS, or missing a
key qualifier. Stay on radar; do not activate.

- **Approach:** re-score on a new trigger or every 90 days.

---

## Anti-ICP — explicit exclusions

Each is a deal you lose late and expensively (from `context-hub/icp.md`).

| Exclusion | Why it fails |
|---|---|
| **Staffed SOC with a SIEM incumbent** | You'd be replacing a security platform on security terms, against a CISO who buys separately. The convergence wedge stops working. |
| **Majority on-prem estate** | Ockham security is cloud-only by design. Say so early. |
| **Azure- or GCP-first** (no material AWS) | AWS is the first-class cloud. Revisit after multi-cloud / CIEM lands. |
| **Large enterprise, 5,000+ employees** | Separate budgets, separate teams, best-of-breed procurement, bake-offs against vendors with published numbers Ockham doesn't have yet. |
| **Wants full autonomy on day one** | Only ~17% have deployed agents at all; a buyer demanding day-one autonomy churns when the trust ramp meets reality. (Flag, don't hard-exclude — reframe to the trust ramp.) |

---

## Qualification Framework

Run in discovery. Use to assign a starting tier before scoring.

### Must-have — deal-breaker if absent

1. **No staffed SOC / no SIEM incumbent** — the single most important qualifier.
2. **AWS + Kubernetes in production** — what makes eBPF, CSPM, and CDR worth
   anything to them.
3. **One team (or one budget) owns uptime *and* security posture** — not two
   teams that cooperate.
4. **Midsize** — roughly ≤1,000 employees, IT org ≤80.

### Strong indicators — 2+ = high confidence

1. A live behavioural trigger (renewal, compliance date, incident, migration).
2. 3–6 separate tools across monitoring, logging, cloud posture, vuln scanning.
3. A compliance mandate in their sector (finserv, insurance, healthcare, public
   sector, regulated services).
4. Outgrown an AWS-native security baseline (Security Hub / GuardDuty / Inspector).
5. A recent cloud-migration or Kubernetes-adoption milestone.

### Red flags — 2+ = deprioritise

1. A CISO owns a separate security budget and roadmap.
2. Majority on-prem.
3. Azure or GCP is the primary cloud.
4. 5,000+ employees.
5. Demands full autonomy immediately.
6. Best-of-breed procurement culture (formal bake-offs, published-numbers RFPs).

---

## ICP Evolution Log

The highest-value artifact after a year — what changed, when, and why. Add an
entry quarterly and after any tier change; re-score the full list after each
change ([`account-scoring.md`](account-scoring.md) § re-score cadence).

| Date | Change | Reason |
|---|---|---|
| 2026-09-04 | Initial tiers + qualification framework derived from `context-hub/icp.md`. | Pre-launch. Validate against the first 90 days of scored accounts and the first design-partner conversations. |
