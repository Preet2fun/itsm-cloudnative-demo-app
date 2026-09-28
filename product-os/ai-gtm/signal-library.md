# Signal Library

Observable events that predict a buying window 1–2 quarters out. This is the
source of truth for all signal-based outreach — every campaign traces back to at
least one signal here. Scoring feeds [`account-scoring.md`](account-scoring.md).

Last updated: 2026-09-04
**All points and hooks are pre-launch hypotheses.** Replace with measured
reply/meeting rates after the first 3–4 campaigns (§ Performance Log). Until
then this is a hypothesis document.

---

## Scoring model

Accounts accumulate signal points (capped at 30 for the scoring model). Combined
with ICP-fit points in [`account-scoring.md`](account-scoring.md).

| Signal-point subtotal | Contribution |
|---|---|
| 25–30 | Strong — likely pushes the account to Tier 1 if ICP fit is there |
| 15–24 | Moderate — Tier 2 trigger |
| 5–14 | Weak — Tier 3 nurture |
| 0–4 | None — monitor |

---

## Tier 1 signals — act immediately

*Alert within 2 hours · research within 24 hours · outreach within 48 hours.*

### Signal: Observability renewal / price shock
**Category:** Behavioural / Intent · **Points:** 35 · **Source:** G2 Buyer Intent, news, job posts, community · **Refresh:** weekly

**Definition:** Evidence of a Datadog / New Relic / Splunk renewal in the next
1–2 quarters, or a public reaction to an incumbent price increase — LinkedIn /
Reddit / HN posts, "observability cost reduction" job posts, RFP language,
"evaluating alternatives to [tool]".

**Why it predicts fit:** The renewal is the only moment the incumbent contract is
actually re-openable. The buyer with no separate security budget feels the
increase hardest — the unified-budget wedge is at maximum leverage.

**Detection method:**
```
- G2 Buyer Intent on the incumbent's category page
- Clay / LinkedIn: job posts mentioning "[incumbent] cost" or "observability spend"
- Track incumbent pricing-change announcements; watch community threads for the account
```

**Message hook:** "Renewal quotes on [incumbent] are up across the board this
year — the teams feeling it worst are the ones with no separate security budget
to spread the cost across. Worth seeing what one platform for both looks like
before you re-sign."

---

### Signal: Compliance deadline
**Category:** Firmographic / Intent · **Points:** 35 · **Source:** regulatory calendars, job posts, filings, news · **Refresh:** weekly

**Definition:** A datable compliance obligation within ~2 quarters — SOC 2 Type II
audit window, DORA (EU financial entities), HIPAA audit, ISO 27001, or a named
large customer's security questionnaire.

**Why it predicts fit:** Forces a posture + detection purchase on a clock, and
the buyer can't stand up a SOC to meet it — they need coverage one team can run
and produce evidence from.

**Detection method:**
```
- GRC / compliance-analyst job posts on the target list
- DORA applicability: EU-regulated financial services / insurance
- "SOC 2 in progress" language on trust-center pages; ISO 27001 statements of intent
```

**Message hook:** "[Framework]'s evidence expectations don't care that you don't
have a SOC — the question is whether one team can produce the audit trail. That's
the gap we close." *(Details: [`playbooks/compliance-deadline.md`](playbooks/compliance-deadline.md).)*

**Decay note:** this signal *rises* as the deadline approaches and drops to 0 the
day after — inverse of the standard decay curve below.

---

### Signal: "Attack or outage?" incident
**Category:** Behavioural · **Points:** 30 · **Source:** status pages, post-mortems, engineering blogs · **Refresh:** weekly

**Definition:** A public incident in the last 90 days whose write-up shows time
lost distinguishing a security event from an operational one — "initially
suspected", "ruled out a security incident", "engaged security out of an
abundance of caution", "war room".

**Why it predicts fit:** They just lived the exact pain the product removes. The
internal urgency is real and datable.

**Detection method:**
```
- Monitor status-page RSS and engineering-blog post-mortems for the target list
- Flag language: "attack", "ruled out", "initially suspected", "abundance of caution"
```

**Message hook:** "Post-mortems that spend a paragraph on 'was this an attack'
usually mean the on-call didn't have security context in the same place as the
traces. That's the half-hour we give back on the first pass." *(Play:
[`playbooks/ops-vs-attack.md`](playbooks/ops-vs-attack.md).)*

---

### Signal: Kubernetes / cloud-migration milestone
**Category:** Technographic / Organizational · **Points:** 28 · **Source:** job posts, conference talks, case studies, changelogs · **Refresh:** weekly

**Definition:** Evidence the account crossed a cloud-native threshold in the last
~6 months — first "Platform Engineer" / "Kubernetes" / "EKS" hires, a KubeCon /
re:Invent talk, a "we migrated to EKS" case study, or a public statement that
hyperscaler-native tooling is no longer enough.

**Why it predicts fit:** eBPF, CSPM, and CDR only pay off once there's real
Kubernetes surface. This is the moment the one-sensor thesis becomes concrete.

**Detection method:**
```
- Clay job-post search: "Platform Engineer" + ("Kubernetes" OR "EKS")
- Conference speaker lists; case-study and engineering-blog pages
```

**Message hook:** eBPF one-sensor angle — "One sensor at the kernel feeds both
your monitoring and your runtime security. At the point you're standing up
Kubernetes properly is when that's cheapest to adopt." *(Play:
[`playbooks/cloud-migration.md`](playbooks/cloud-migration.md).)*

---

### Signal: First security hire into an IT / platform team (no SOC)
**Category:** Organizational · **Points:** 30 · **Source:** LinkedIn · **Refresh:** daily

**Definition:** An ICP account hires its first "Security Engineer" / "Cloud
Security Engineer" / "Head of Security" reporting into IT / Infrastructure /
Platform (there is no CISO org), started in the last 45 days.

**Why it predicts fit:** Someone now owns security but has no team, no SIEM, and
a mandate. The first 90 days is when they decide what to buy — and teams at this
size rarely stand up a SIEM.

**Detection method:**
```
- LinkedIn title + reporting-line inference (Clay Claygent)
- Cross-check: no CISO / VP Security in the org
- Verify start date within 45 days
```

**Message hook:** "First 90 days owning security with no SOC behind you is when
you decide what to stand up. Most teams your size don't stand up a SIEM — they
put detection where the telemetry already is."

---

## Tier 2 signals — add to active sequences

### Signal: Outgrown AWS-native security
**Category:** Technographic · **Points:** 20 · **Source:** BuiltWith / Clay + job posts

**Definition:** Runs AWS Security Hub / GuardDuty / Inspector as the security
baseline **and** a separate commercial APM (Datadog / New Relic / etc.).

**Why it predicts fit:** The split Ockham's convergence closes; the "native isn't
enough anymore" realisation is usually already present.

---

### Signal: Tool sprawl (3–6 separate tools)
**Category:** Technographic · **Points:** 18 · **Source:** BuiltWith / Clay technographics

**Definition:** 3+ distinct products detected across monitoring, logging, cloud
posture, and vulnerability scanning.

**Why it predicts fit:** Consolidation pressure; a budget conversation is already
happening internally.

---

### Signal: Consolidation / alert-fatigue post by an IT leader
**Category:** Behavioural / Intent · **Points:** 18 · **Source:** [`../ai-feedback/`](../ai-feedback/) `signal-scan` + Common Room / Trigify

**Definition:** An IT Director / Head of Infra / platform lead at a target
account posts publicly about tool consolidation, alert fatigue, on-call load, or
"one team doing both ops and security" in the last 14 days.

**Why it predicts fit:** Self-identified pain, public, creates a natural,
non-awkward reason to reach out.

**Detection:** routes through `ai-feedback/signal-scan` — **do not build a second
detector.** signal-scan returns volume, recency, and the verbatim.

---

## Tier 3 signals — monitor (+5 each, valuable only in combination)

- Followed Ockham (or an Ockham founder) on LinkedIn
- Visited the pricing or a "vs" page (once the site exists)
- Downloaded an Ockham piece of content
- An engineer from the account engaged with the Ockham OSS repo (if one exists)

---

## Signal combinations

| Combination | Bonus | What it means | Action |
|---|---|---|---|
| Price shock + tool sprawl | +12 | The consolidation TCO case writes itself; a budget review is already underway | Tier 1, AE-led, lead with single-platform TCO |
| Compliance deadline + no-SOC | +12 | Needs audit-grade coverage on a clock and can't staff it | Tier 1, lead with `playbooks/compliance-deadline.md` |
| K8s milestone + first security hire | +10 | The eBPF one-sensor story lands, with a named owner to tell it to | Tier 1, technical-buyer + security-lead dual thread |
| "Attack or outage?" incident + renewal window | +10 | Fresh pain and a contract that is actually re-openable | Escalate to Tier 1 immediately |

---

## Suppression rules

An account in any of these states gets **no triggered outreach**, regardless of
score:

- Existing customer / design partner → suppress all; route to the partner owner
- Active opportunity in CRM → AE owns; suppress automated
- **Staffed SOC + SIEM incumbent detected** → suppress; log "out of ICP — SOC"
- **Majority on-prem** → suppress; "revisit on a cloud-migration announcement"
- **Azure- or GCP-first**, no material AWS → suppress; "revisit after multi-cloud"
- **5,000+ employees** → suppress; route to a future enterprise motion
- Unsubscribed in last 90 days → suppress email
- Contacted in last 45 / 60 / 90 days (Tier 1 / 2 / 3) → cooldown

---

## Signal decay

Standard curve (exception: the compliance-deadline signal, which rises toward its
date — see its entry).

| Signal age | Score multiplier |
|---|---|
| 0–30 days | 100% |
| 31–60 days | 75% |
| 61–90 days | 50% |
| 91–180 days | 25% |
| 180+ days | 0% (expires) |

Recalculate weekly. Accounts that drop below a tier threshold are downgraded
automatically — otherwise the active list quietly fills with stale interest.

---

## Signal Performance Log

Update after every campaign ([`plays/weekly-update.md`](plays/weekly-update.md)).
A signal with 30+ sends and no meetings is a calibration flag. Filled sample:
[`examples/signal-performance-log.md`](examples/signal-performance-log.md).

| Signal | Sends (90d) | Reply rate | Meeting rate | Pipeline | Notes |
|---|---|---|---|---|---|
| Observability renewal / price shock | | | | | |
| Compliance deadline | | | | | |
| "Attack or outage?" incident | | | | | |
| K8s / cloud-migration milestone | | | | | |
| First security hire (no SOC) | | | | | |
| Outgrown AWS-native security | | | | | |
| Tool sprawl | | | | | |
| Consolidation / alert-fatigue post | | | | | |
