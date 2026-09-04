# Signal Performance Log — filled sample

> **SAMPLE DATA — fictional.** This is what
> [`../signal-library.md`](../signal-library.md) § Performance Log looks like
> after ~3 weeks of one campaign. The real one stays empty until real campaigns
> run.

Last updated: 2026-09-08

| Signal | Sends (90d) | Reply rate | Meeting rate | Pipeline | Notes |
|---|---|---|---|---|---|
| **Observability renewal / price shock** | 108 | 12.0% | 3.7% | 2 POCs (Meridian Freight + 1) | Strongest signal. **Steep proximity decay** — <8 wks to renewal replies at 18%, 8–13 wks at 7%. Tighten enrolment to verified <13-week renewals. |
| Compliance deadline | 6 | — | — | — | Only Torvin Health enrolled so far (hand outreach, not this campaign). Too little data. |
| "Attack or outage?" incident | 4 | 25% (1/4) | 0% | — | Tiny sample. The one reply came from an account 4 weeks post-incident; the 10-week-old one (Kettle & Byte) did not reply — consistent with the decay curve. |
| K8s / cloud-migration milestone | 0 | — | — | — | No campaign yet. |
| First security hire (no SOC) | 3 | 33% (1/3) | 33% (1/3) | — | Torvin Health's Priya Anand replied and joined the compliance-deadline call. Promising; needs volume. |
| Outgrown AWS-native security | 0 | — | — | — | Tier-2 amplifier only; not run standalone. |
| Tool sprawl | (amplifier) | — | — | — | Present on 9 of 18 enrolled accounts. Not run as a primary trigger. |
| Consolidation / alert-fatigue post | 2 | 50% (1/2) | 0% | — | NorthGate's IT Director replied to a light touch off the LinkedIn post — "not right now, ask me at renewal." Logged the re-score trigger. |

## Calibration flags

- **Renewal signal:** proximity is a stronger predictor than presence. Candidate
  change to `signal-library.md`: split into "renewal <8 weeks" (40 pts) and
  "renewal 8–13 weeks or price complaint" (25 pts).
- **Incident signal:** the 50% decay band (61–90 days) looks right — the 10-week
  account went cold, the 4-week account converted.
- Nothing yet has 30+ sends with zero meetings, so no signal is on the "cut"
  list.
