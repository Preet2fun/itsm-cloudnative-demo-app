# Pricing & Packaging — Strategy

**Strategy only.** No list prices, discounts, contract terms, or quotes — those
live outside the repo (root `CLAUDE.md` and the GTM-repository rule: keep
commercial terms out of git).

Last updated: 2026-09-04 · Status: **direction, not decided.** Final packaging
owner: founder / future VP Sales.

---

## Packaging principle

**Land on observability, expand into security — on the same platform and the
same budget.** The wedge is that expansion doesn't require a new vendor, a new
procurement cycle, or a CISO sign-off. Packaging must not break that: security
capability is an *upgrade path*, not a separate SKU sold to a separate buyer.

---

## Edition ladder (working model)

| Edition | Includes | Gated behind |
|---|---|---|
| **Observe** | Full observability (MELT), agentic investigation, linked-evidence timelines | Entry |
| **Observe + Secure** | Adds CDR, CSPM, VM for cloud/container assets — fed by the same eBPF sensor | An upgrade on the same contract; no new buyer |
| **Autonomous** | Higher agent autonomy (act-with-approval → act), runbook execution | Trust ramp: earned after a measured period at lower autonomy |

The ladder mirrors the product roadmap (`context-hub/company-brief.md`:
observability → CDR/CSPM/VM → agentic security → autonomy).

---

## Entitlement model

- **Metric:** direction is usage-shaped (data volume / hosts / cloud accounts),
  not per-seat — the buyer is a small team and per-seat penalises the ICP.
- **Autonomy is an entitlement, not just a feature flag** — tied to the trust
  ramp; a customer demanding day-one full autonomy is a red flag
  ([`icp-tiers.md`](icp-tiers.md)).
- Security capability entitled by the same contract as observability — never a
  separate order form.

---

## What sales leads with

- **vs. a renewal:** single-platform TCO — one bill replacing an APM bill plus an
  emerging security spend. (Play: [`playbooks/renewal-price-shock.md`](playbooks/renewal-price-shock.md).)
- **vs. "we'll add security later":** the sensor is already deployed; enabling
  Secure is a switch, not a project.
- **Design-partner phase:** pricing latitude in exchange for a reference logo and
  co-build feedback ([`launch-plan.md`](launch-plan.md)).

---

## Open questions (→ `../data-analysis/`)

- The usage metric that predicts value without punishing cloud-native scale.
- Where the Observe → Secure upgrade price sits relative to the two tools it
  replaces.
- Whether Autonomous is a price tier or a maturity gate at the same price.
