# Workflow: Enrichment

Populate an account with the firmographic, technographic, and organizational data
[`../account-scoring.md`](../account-scoring.md) needs. Goal: the *right* data for
Ockham's signals, not complete data.

---

## Enrichment waterfall

Run in order; stop when a field is covered. Don't pay for what's free.

### Tier 1 — free
1. **Company site + LinkedIn** — headcount, product, recent hires, tech stack
   (job posts). Look specifically for: an SRE function? a CISO / security team? a
   compliance / GRC role?
2. **Crunchbase (free)** — funding, stage, investors.
3. **BuiltWith / Wappalyzer** — tech-stack fingerprint (monitoring, security,
   cloud).
4. **Status page + engineering blog** — incident history, the "attack or outage"
   language ([`../signal-library.md`](../signal-library.md)).

Covers: snapshot, initial ICP screen, tech-stack signals.

### Tier 2 — paid waterfall *(once there's a real motion)*
For accounts past the Tier-1 screen (ICP score ≥ 40): a Clay-style waterfall —
firmographics → contact data → email validation → LinkedIn verification. Quality
gate: flag email confidence < 80%.

### Tier 3 — proprietary *(build over time)*
Ockham-specific sources competitors don't have:

| Source | Signal | Access | Cadence |
|---|---|---|---|
| Observability-vendor renewal timing | price-shock signal | manual / news | ongoing |
| Regulatory calendars (DORA, sector audits) | compliance-deadline signal | public | quarterly |
| Kubernetes / KubeCon speaker lists, EKS case studies | K8s-milestone signal | public | ongoing |

---

## Data quality gate

An account is "enrichment complete" when:
- Employee count, sector, cloud, Kubernetes yes/no — populated
- SOC status and security-org shape — assessed (the key qualifier)
- Tech stack — ≥3 tools identified
- ICP score — calculated
- Primary contact — name, title, channel; ≥1 secondary stakeholder

Below this, the account stays in the queue — it doesn't move to a sequence.

---

## Re-enrich cadence

| Tier | Re-enrich |
|---|---|
| Tier 1 | 30 days |
| Tier 2 | 60 days |
| Tier 3 | 90 days |
| Tier 4 | on a re-qualification trigger |

---

## Email deliverability infrastructure

*Not optional — handle before any sequence launches.*

- Send from a **subdomain** (e.g. `outbound.ockham.example`), never the primary
  domain. SPF, DKIM, DMARC on every sending domain — verify before sending.
- **Warm** new domains 4–6 weeks: start 10–20/day, +20–30%/week.
- **Per mailbox:** ≤ 40–50/day once warmed. Multiple signals/tiers → multiple
  mailboxes, rotate.
- **Bounce:** verify emails before enrolment; target < 2% hard bounce; > 5% =
  pause and review the domain.
- Pull any mailbox with reply rate < 1% or bounce > 3%.
