# Account Scoring — Q4 Target List

> **SAMPLE DATA — fictional accounts, illustrative scores.**

Date: 2026-08-11 · Scored by: Claude (`plays/account-scoring.md`) · Model:
[`../account-scoring.md`](../account-scoring.md) · Accounts:
[`accounts.md`](accounts.md)

---

## Summary table (sorted by total)

| # | Account | Firmo /30 | Techno /20 | Org /20 | Signal /30 | Total | Tier | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | **Torvin Health** | 30 | 20 | 20 | 30 | **100** | **1** | Compliance + security hire + combo |
| 2 | **Meridian Freight** | 25 | 20 | 20 | 30 | **95** | **1** | Datadog renewal window open |
| 3 | NorthGate Public Sector | 30 | 20 | 20 | 18 | 88 | **2** | Score is Tier-1 band — **no live Tier-1 signal** → Tier 2 |
| 4 | Kettle & Byte | 30 | 13 | 18 | 15 | 76 | **2** | Was ~91 six weeks ago; incident decayed 30→15 |
| 5 | Quillstone Retail | 20 | 9 | 20 | 0 | 49 | **4** | **Gate: majority on-prem** → capped |
| 6 | Aperture Labs | 15 | 20 | 0 | 0 | 35 | **Exclude** | **Gate: staffed SOC + Panther SIEM** |

---

## Breakdowns

### 1. Torvin Health — 100 — Tier 1

| Category | Score | Notes |
|---|---|---|
| Firmographic | 30 | 540 emp (10) · healthcare (10) · ~$120M ARR (10) |
| Technographic | 20 | AWS majority (8) · EKS in prod (7) · 4 tools (5) |
| Organizational | 20 | No SOC / no SIEM — Splunk is logs only (10) · one team, VP Infra owns both (6) · buyer VP Infrastructure (4) |
| Signals (decayed) | 30 (capped) | Compliance deadline 35 + first security hire 30 + tool sprawl 18 + combo 12 = 95 → cap 30 |

**Qualifies:** every must-have; two Tier-1 signals live; the audit clock is real.
**Next action:** `plays/account-research.md` → the compliance-deadline playbook,
IT Director + Priya Anand on thread.
**Re-score trigger:** audit passes / slips, or a second security hire.

### 2. Meridian Freight — 95 — Tier 1

| Category | Score | Notes |
|---|---|---|
| Firmographic | 25 | 320 emp (10) · logistics = adjacent regulated (5) · ~$26M ARR (10) |
| Technographic | 20 | AWS majority (8) · EKS primary compute (7) · 4 tools (5) |
| Organizational | 20 | No SOC (10) · one team, IT Director + 2-eng rotation (6) · buyer IT Director (4) |
| Signals (decayed) | 30 (capped) | Renewal 35 (fresh) + tool sprawl 18 + combo 12 = 65 → cap 30 |

**Qualifies:** all must-haves; renewal window is the only re-openable moment.
**Reduces score:** sector isn't in the mandated set (−5 firmographic).
**Next action:** `plays/account-research.md` → renewal-price-shock playbook,
POC scoped to finish before the re-sign date.
**Re-score trigger:** the renewal closes (drops to Tier 3 nurture).

### 3. NorthGate Public Sector — 88 raw → **Tier 2**

| Category | Score | Notes |
|---|---|---|
| Firmographic | 30 | 460 emp (10) · public sector (10) · ~$70M ARR (10) |
| Technographic | 20 | AWS (8) · EKS (7) · 3 tools (5) |
| Organizational | 20 | No SOC (10) · one team, IT Director (6) · buyer IT Director (4) |
| Signals (decayed) | 18 | Consolidation / alert-fatigue post — **Tier-2 signal** only |

**Hard gate #3:** score is in the Tier-1 band but no **Tier-1 behavioural**
signal is live → **treated as Tier 2** until one fires.
**Next action:** Tier-2 sequence off the consolidation post; monitor for a
renewal or compliance signal.
**Re-score trigger:** a Datadog renewal window opens, or a compliance deadline
surfaces → immediate Tier 1.

### 4. Kettle & Byte — 76 — Tier 2  *(decay example)*

| Category | Score | Notes |
|---|---|---|
| Firmographic | 30 | 210 emp (10) · payments = finserv (10) · ~$18M ARR (10) |
| Technographic | 13 | AWS majority (8) · EKS ~40% of prod, migrating (3) · 2 primary tools (2) |
| Organizational | 18 | No SOC (10) · one team operationally (6) · buyer unclear — Head of Platform + finance approver (2) |
| Signals (decayed) | 15 | "Attack or outage?" incident, 10 weeks old → 30 × 50% = 15 |

**Was Tier 1** on 2026-06-30 (incident fresh at 30 + a since-expired sprawl
signal). Decay moved it a full tier.
**Next action:** Tier-2 nurture; keep the ops-vs-attack angle warm.
**Re-score trigger:** a renewal window, or a second incident.

### 5. Quillstone Retail — 49 raw → **Tier 4**

Firmo 20 · Techno 9 (AWS present not majority 4 · no k8s 3 · 2 tools 2) · Org 20
· Signals 0.
**Hard gate:** majority on-prem (~65%) → **cap at Tier 4**. Ockham security is
cloud-only.
**Re-score trigger:** a public cloud-migration announcement.

### 6. Aperture Labs — 35 raw → **Exclude**

Firmo 15 (1,400 emp → 5) · Techno 20 · **Org 0** (staffed SOC + Panther SIEM;
separate SRE and security teams) · Signals 0.
**Hard gate:** staffed SOC with a SIEM incumbent → **Exclude**. Log the
disqualifier; remove from the active list. The Resolve.ai evaluation is real
intent but for a buyer outside Ockham's ICP.

---

## Calibration note (→ `../account-scoring.md` § Calibration Log)

Fit points saturate for curated ICP accounts (3 of 6 at 20/20 organizational,
2 at 30/30 firmographic). In practice the tier is decided by **which behavioural
signal is live and how fresh it is** (see NorthGate and Kettle & Byte), not the
total. Candidate change: widen the fit bands, or raise the signal cap above 30.
