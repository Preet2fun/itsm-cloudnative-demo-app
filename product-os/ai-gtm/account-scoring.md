# Account Scoring Model

Score any account 0–100, assign a tier, decide the action. Replaces gut feel with
a repeatable model. The executable version is
[`.claude/agents/gtm-account-scoring.md`](../../.claude/agents/gtm-account-scoring.md); this file is the model it
runs.

Inputs: [`icp-tiers.md`](icp-tiers.md) (criteria) · [`signal-library.md`](signal-library.md)
(signal points + decay).

---

## Part 1 — ICP fit (0–70)

### Firmographic (0–30)

| Criterion | Points |
|---|---|
| Employee count 100–1,000 | 10 · (1,001–2,500 → 5 · else → 0) |
| Sector is compliance-mandatory (finserv, insurance, healthcare, public sector, regulated services) | 10 · (adjacent regulated → 5 · none → 0) |
| Revenue under ~$1B, or unknown but headcount fits | 10 · (else → 0) |

### Technographic (0–20)

| Criterion | Points |
|---|---|
| AWS cloud-native or majority | 8 · (AWS present, not majority → 4 · none → 0) |
| Kubernetes in production | 7 · (containers, no k8s → 3 · neither → 0) |
| 3–6 separate ops/security tools detected | 5 · (1–2 → 2 · unknown → 0) |

### Organizational (0–20)

| Criterion | Points |
|---|---|
| No dedicated SOC / no SIEM incumbent | 10 · (SOC forming, no SIEM → 5 · staffed SOC + SIEM → 0 **and red flag**) |
| One team + one budget owns uptime and security | 6 · (two teams cooperate → 3 · fully separate → 0) |
| Economic buyer is IT Director / Head of Infra / CIO | 4 · (unclear → 2 · CISO-owned → 0) |

---

## Part 2 — Signal score (0–30)

Sum active signal points from [`signal-library.md`](signal-library.md), **decay
applied**, plus combination bonuses. Cap at 30.

---

## Total → tier → action

| Total | Tier | Action |
|---|---|---|
| 80–100 | **Tier 1** | Founder / AE-led. Run [`.claude/agents/gtm-account-research.md`](../../.claude/agents/gtm-account-research.md) within 24 h, outreach within 48 h. |
| 60–79 | **Tier 2** | Signal-triggered sequence within 48 h ([`.claude/agents/gtm-signal-to-sequence.md`](../../.claude/agents/gtm-signal-to-sequence.md)); SDR reviews touch 1. |
| 40–59 | **Tier 3** | Automated light-touch nurture. |
| 20–39 | **Tier 4** | Monitor. Re-score on a new trigger or in 90 days. |
| 0–19 | **Exclude** | Off-ICP. Remove from active list; log the disqualifier. |

---

## Hard gates — override the score

- **Any suppression rule from `signal-library.md` fires** → Exclude, regardless
  of points.
- **A disqualifier is present** — staffed SOC + SIEM incumbent, majority on-prem,
  Azure/GCP-first, or 5,000+ employees → **cap at Tier 4** even if points are
  high. These are the "lose late and expensively" cases.
- Score says Tier 1 but no Tier-1 *behavioural* signal is active → treat as
  Tier 2 until one fires (`icp-tiers.md` Tier 1 definition).

---

## Re-score cadence

| Segment | Frequency | Why |
|---|---|---|
| Full account list | Quarterly | ICP drift, new signal data |
| Tier 1 accounts | Monthly | High value; track closely |
| Active pipeline | After each campaign | Campaign results reveal scoring gaps |
| After any `icp-tiers.md` change | Immediately | Find newly qualified / disqualified accounts |

After a re-score, pull the delta: accounts that dropped a tier leave AE
pipelines; accounts that moved up get activated.

---

## Output format

```markdown
# Account Score: <Company>
Date: <YYYY-MM-DD> · Scored by: <Claude / name>

| Category | Score | Max | Notes |
|---|---|---|---|
| Firmographic | X | 30 | |
| Technographic | X | 20 | |
| Organizational | X | 20 | |
| Signals (decayed) | X | 30 | <signals present> |
| **Total** | **X** | **100** | |

## Tier: <1 / 2 / 3 / 4 / Exclude>
## Qualifies: <2–3 specific reasons>
## Reduces score / disqualifies: <gaps; what would change the tier>
## Next action: <which play / sequence / monitor>
## Re-score trigger: <e.g. "a Datadog renewal window opens" / "hires a security engineer">
```

Batch runs output a table sorted by total, Tier 1 flagged. File under
`outputs/YYYY-MM-DD-scoring-<name>.md`.

---

## Calibration Log

Update when the model is wrong — an account that scored high but never engaged,
or scored low but converted. Review quarterly and adjust point values where the
model is consistently off.

> **Row below is a dummy, illustrative entry — no real account or outcome
> behind it.** It exists so `gtm-weekly-update` has something concrete to
> read even before a real campaign has run. Replace with real rows as soon
> as an actual account outcome is known; delete the dummy row at that point
> rather than leaving it to be mistaken for data.

| Date | Account | Predicted tier | Actual outcome | What the model missed |
|---|---|---|---|---|
| 2026-09-15 *(SAMPLE)* | "Meridian Freight" *(fictional, see `examples/`)* | Tier 1 (92/100) | No reply after 3 touches | Scored organizational fit high off a job post for "Security Engineer," but the role turned out to report into a fully-staffed SOC not visible from public sources — a real pull would need a firmographic source that shows team structure, not just headcount |
| | | | | |
