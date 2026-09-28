# Sample Accounts

> **SAMPLE DATA — fictional. Every name is invented.**

Six prospect companies used across the example scoring, research brief, and
campaign. Chosen to span the tiers and both hard-gate exclusions.

---

## 1. Meridian Freight  · *Tier 1*

Logistics / supply-chain visibility SaaS. **~320 employees**, Series C ($40M,
8 months ago), ~$26M ARR. **AWS**, primary compute on **EKS**. **No SOC** — IT
Director *Dev Nakamura* owns uptime and security; a 2-engineer platform rotation.
Stack: **Datadog** + AWS GuardDuty + Snyk + a hosted logging tool (**4 tools**).

**Signals fired:**
- *Observability renewal / price shock* — Datadog renewal in ~10 weeks; a
  "Vendor Manager – Observability & Tooling" job post went up 12 days ago. (35, fresh)
- *Tool sprawl* — 4 distinct tools across monitoring / logging / posture / SCA. (18)
- Combination: price shock + tool sprawl → **+12**.

---

## 2. Torvin Health  · *Tier 1*

Healthcare data & analytics platform. **~540 employees**, PE-backed, ~$120M ARR.
**AWS + EKS**. **No SOC** — hired its **first Security Engineer** (*Priya Anand*,
reports to VP Infrastructure) **32 days ago**; no CISO. **SOC 2 Type II** audit
window opens in ~14 weeks; HIPAA in scope. Stack: New Relic + AWS Security Hub +
Tenable + Splunk (logs only) (**4 tools**).

**Signals fired:**
- *Compliance deadline* — SOC 2 Type II, ~14 weeks out, ramping. (35)
- *First security hire into an IT team with no SOC* — 32 days, within window. (30)
- *Tool sprawl* — 4 tools. (18)
- Combination: compliance deadline + no-SOC → **+12**.

---

## 3. Kettle & Byte  · *Tier 2*  *(was Tier 1 six weeks ago)*

Payments infrastructure (fintech). **~210 employees**, ~$18M ARR. **AWS**,
migrating to EKS (~40% of prod). **No SOC** — Head of Platform owns both;
security spend approved on the finance side (buyer clarity is mixed). Stack:
Datadog + Snyk (**2 primary tools**).

**Signals fired:**
- *"Attack or outage?" incident* — public post-mortem **10 weeks ago**:
  "engaged our security partner to rule out a breach"; ~3 hours lost. Decayed
  from 30 → **15** (50% band).

*No live combination. Re-score trigger: a Datadog renewal window, or a second
incident.*

---

## 4. NorthGate Public Sector Cloud  · *Tier 2*  *(score says Tier 1)*

Case-management SaaS for local government. **~460 employees**, ~$70M ARR.
**AWS + EKS**. **No SOC** — IT Director owns both. Public sector → regulated.
Stack: Datadog + Prometheus/Grafana + AWS Security Hub (**3 tools**).

**Signals fired:**
- *Consolidation / alert-fatigue post* — the IT Director posted on LinkedIn
  8 days ago: "three dashboards, one team, and every incident starts with 'which
  one do I open'." Surfaced by `ai-feedback/signal-scan`. **Tier-2 signal (18).**

*Score lands in the Tier-1 band, but there is no live **Tier-1 behavioural**
signal → treated as Tier 2 until one fires (`account-scoring.md` hard gate #3).*

---

## 5. Aperture Labs  · *Exclude*

Developer-tools company. **~1,400 employees**. AWS + EKS. **Stood up a SOC this
year** — SOC manager + 3 analysts, running **Panther as SIEM**; also has a
12-person SRE team. Evaluating Resolve.ai for AI SRE.

**Hard gate:** *staffed SOC with a SIEM incumbent* → **Exclude**, regardless of
points. Log the disqualifier and remove from the active list. (The Resolve.ai
evaluation is real intent, but for an out-of-ICP buyer.)

---

## 6. Quillstone Retail Systems  · *Tier 4 — monitor*

Retail / POS platform. **~150 employees**, ~$22M ARR. **~65% on-prem** (legacy
datacenter for the POS core), ~20% on AWS, some containers, no Kubernetes. **No
SOC** — one IT Manager owns everything. Stack: SolarWinds + AWS Security Hub
(**2 tools**).

**Hard gate:** *majority on-prem* → **cap at Tier 4**. Ockham security is
cloud-only. Re-score trigger: a public cloud-migration announcement.
