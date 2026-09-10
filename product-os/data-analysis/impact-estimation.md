# Impact Estimation

Pre-build sizing for a candidate feature or initiative, using live product data
instead of guesswork. Adapted from the ccforpms.com "analyze data" impact-
estimation method. Feeds
[`../ai-discovery/stages/02-opportunity-scoring.md`](../ai-discovery/stages/02-opportunity-scoring.md)
(grounds Magnitude / Frequency numerically, the same way `ai-feedback/`
signal-scan does) and
[`../ai-prd/stages/10-roi-business-case.md`](../ai-prd/stages/10-roi-business-case.md)
(a bottoms-up cross-check on the revenue-scenario numbers, assembled into PRD
§12.1).

---

## When to use it

Once there's *some* usage or funnel data to pull from — a live feature, a
closed beta, or a comparable existing flow. Before that, stage 10's top-down
TAM/SAM/SOM is the only lever available; this is the bottom-up complement once
telemetry exists, and the two should roughly agree.

## The formula

```
Impact = Users Affected × Current Action Rate × Expected Lift × Value per Action
```

| Term | What it is | Ockham source |
|---|---|---|
| **Users Affected** | Tenants/users actually reached — adjusted for rollout, not the full ICP | `[Data: …]` rollout curve from the feature-flag / cohort table; never assume 100% of the ICP is on the new build |
| **Current Action Rate** | Baseline rate of the action today | `[Data: …]` from Prometheus / OTel metrics (root `CLAUDE.md` §5 `itsm_*` counters) or the warehouse |
| **Expected Lift** | How much the action rate moves | Ranked by reliability: a prior Ockham experiment (see `experiment-analysis.md`) > an `ai-feedback/` VoC signal > a named competitor benchmark > expert judgement — tag accordingly |
| **Value per Action** | $ or strategic value of one action | Ties to the edition ladder (`../gtm/pricing-and-packaging.md`): does the action drive activation → land, retention → expansion (Observe → Observe+Secure), or virality → seat/tenant growth? |

Every term carries a citation tag per
[`../ai-prd/citations.md`](../ai-prd/citations.md) — Measured / Assumed /
Gated. An Assumed Expected Lift is normal pre-launch; a Users-Affected number
that's actually assumed but written as Measured is the failure mode to avoid.

## Three scenarios, never one number

Run the formula pessimistic / realistic / optimistic — vary **Expected Lift**
and **Users Affected**, the two least-certain terms; hold the other two fixed
unless there's a real reason not to. Carry all three into PRD §12.1 alongside
the top-down revenue scenarios. If the two methods disagree by a lot, say why —
don't average them away.

## Do / Don't

**Do:** cross-reference with `../ai-feedback/`'s signal-scan before trusting a
funnel number in isolation — a drop-off can mean the feature is bad, or that
the wrong segment saw it; segment Users Affected and Action Rate by ICP tier
(`../gtm/icp-tiers.md`) before totalling; weight the retention/expansion term
over one-time activation — Ockham's model is land-and-expand, not one-time
conversion.

**Don't:** assume every tenant is on the latest build; treat one pilot
customer's lift as the fleet-wide lift; let a Gated Expected Lift get narrated
as Measured once it's in a slide.

## Worked example — SAMPLE, hypothetical

> Illustrative only — no real telemetry behind these numbers.

Feature: AI-drafted incident postmortem (auto-generates a draft postmortem doc
from the investigation trail).

| Scenario | Users Affected | Current Action Rate | Expected Lift | Value per Action | Impact |
|---|---|---|---|---|---|
| Pessimistic | 40 tenants (Tier 1–2 rollout only) `[Assumed]` | 12% write a postmortem today `[Data: …]` | +5pp `[Assumed: analogous RCA-adoption pattern]` | 1 fewer analyst-hour ≈ $60 | ~$1,000/mo |
| Realistic | 40 tenants | 12% | +15pp | $60 | ~$3,600/mo |
| Optimistic | 40 tenants | 12% | +30pp | $60 | ~$7,200/mo |

**Recommendation** reads the same as stage 10's: state which scenario is
load-bearing for the build decision, and what would move it — e.g. "worth
building at Realistic; kill trigger is below Pessimistic after one quarter of
data."
