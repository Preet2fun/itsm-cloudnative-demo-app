# Workflow: Signal Routing

What happens when a signal fires — which account gets enriched, who gets
notified, which sequence triggers, and which signals suppress outreach. The
connective tissue between detection and [`../plays/signal-to-sequence.md`](../plays/signal-to-sequence.md).

---

## Detection methods

| Cadence | Signal | Method |
|---|---|---|
| Real-time | Observability price-shock / renewal chatter | G2 Buyer Intent; community monitoring |
| Real-time | Funding / major news | Crunchbase webhook |
| Daily | First security hire (no SOC) | LinkedIn title + reporting-line inference |
| Daily | Consolidation / alert-fatigue post | `../../ai-feedback/` `signal-scan` (LinkedIn / community) |
| Weekly | Compliance deadline | Regulatory calendars; GRC job posts; trust-center pages |
| Weekly | "Attack or outage?" incident | Status-page RSS; engineering-blog post-mortems |
| Weekly | K8s / cloud-migration milestone | Job posts; conference speaker lists; case studies |
| Weekly | Tool sprawl / outgrown AWS-native | BuiltWith delta |
| Weekly | Signal decay | Scoring-model batch |

---

## Routing decision tree

```
Signal fires on account X
│
├── X is a customer / design partner?      → route to partner owner. Stop.
├── X has an active opportunity?           → add signal note. Alert AE. Stop.
├── X is suppressed (see below)?           → log signal, no outreach. Stop.
│
├── Calculate score (../account-scoring.md, decay applied)
│   ├── ≥ 80 AND a live Tier-1 behavioural signal  → Tier 1
│   │        alert founder/AE · run account-research within 24 h · outreach within 48 h
│   ├── 60–79 (or ≥80 with no Tier-1 signal)        → Tier 2
│   │        trigger the matching sequence within 48 h · SDR reviews touch 1
│   ├── 40–59                                        → Tier 3 automated sequence
│   └── < 40                                         → log, update score, no outreach
│
└── Disqualifier present (SOC+SIEM / on-prem / Azure-GCP / 5,000+)?
         → cap at Tier 4 (monitor) regardless of score
```

---

## Suppression rules

No triggered outreach, regardless of score:

- Customer / design partner · active opportunity · unsubscribed in 90 days ·
  "do not contact" in CRM · legal/compliance hold
- Contacted in last **45 / 60 / 90 days** (Tier 1 / 2 / 3) → cooldown
- Any disqualifier from [`../icp-tiers.md`](../icp-tiers.md) § Anti-ICP →
  suppress and log the reason

---

## Alert templates

**Tier 1 → founder / AE:**
```
Tier 1 signal — <Company> — <signal name>
Fired: <date> · Score: <X>/100 · ICP fit: <key indicators>
Recommended contact: <name, title>
Action: review the research brief and approve outreach by <date + 48h>.
```

**Tier 2 → SDR:**
```
<Company> entered Tier 2 — <signal> fired <X> days ago. Score <X>/100.
Sequence <name> queued, touch 1 <date>. Review touch 1 before send.
```
