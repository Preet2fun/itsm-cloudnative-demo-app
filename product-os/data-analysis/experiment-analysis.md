# Experiment Analysis

Post-launch framework for deciding **ship / iterate / kill** on a shipped
feature or A/B test — using more than the topline number. Adapted from the
ccforpms.com "analyze data" experiment-analysis hierarchy. Feeds
[`../ai-prd/prd-template.md`](../ai-prd/prd-template.md) §10 (Data &
Instrumentation) and Addendum E (evaluation strategy — this hierarchy is what
"online monitoring" means in practice), and
[`../ai-launch-strategy.md`](../ai-launch-strategy.md)'s scale-when-green gate:
a lens can't call itself Green on a topline number alone.

---

## The hierarchy

Work top to bottom. Stopping at level 1 or 2 is the most common way a real win
gets missed, or a real loss gets shipped anyway.

### 1. Topline metrics
A quick read, never the decision. State the metric per
`../context-hub/positioning.md`'s metric rules — frame time-based value as
**time-to-first-hypothesis**, never "in seconds."

### 2. Statistical significance
p < 0.05 and the confidence-interval width. A wide interval on a small tenant
count is common early — say so; don't round it up to "significant."

### 3. Segment analysis
Cut by `../gtm/icp-tiers.md` tier, by edition (Observe / Observe+Secure /
Autonomous), and by ICP fit. A flat topline average can hide a segment win and
a segment loss cancelling out — read segments **before** a kill call, not
after.

### 4. Quality metrics
Quantity of the action vs. whether it held up. E.g. "investigations where the
AI's ranked hypothesis was opened" (quantity) vs. "opened, accepted, and not
reverted a week later" (quality) — the second one is what predicts renewal.

### 5. Leading indicators
Early signals of durable success, checked before the metric has had time to
mature: repeat use of the same capability within N days, agent-skill reuse
across incidents, or a tenant moving up the edition ladder.

## Ship / iterate / kill

| Read | Call |
|---|---|
| Topline flat/negative, but a real segment wins cleanly with no offsetting loss elsewhere | **Ship to that segment only** — narrow the target, don't kill the feature |
| Significant win, quality metrics hold, leading indicators trend up | **Ship broadly** |
| Significant but quality metrics don't hold (activation up, retention flat/down) | **Iterate** — the mechanism works, the payoff doesn't stick yet |
| Not significant, or significant but every segment is flat/negative | **Kill** — record what was learned, not just that it failed |

## AI-specific addition

For an AI-native feature, run this alongside — not instead of — the PRD's
Addendum D/E checks: a topline win that only holds because a hallucination
guardrail was loosened, or because confidence thresholds were quietly relaxed,
is not a real win. Cite the groundedness / correction-rate numbers next to the
lift number, not in a separate doc.

## Do / Don't

**Do:** run the segment cut before a kill decision; treat "not found in the
data" as a valid, stated result; keep the eval query/dataset the same across
weeks so numbers are comparable.

**Don't:** kill on topline alone; report a single scenario as if the lift is
guaranteed; let an experiment that only worked for Tier 1 accounts get
narrated as a fleet-wide win.

## Worked example — SAMPLE, hypothetical

> Illustrative only.

Experiment: auto-suggest the runbook match at investigation start (vs. only
after RCA completes).

| Level | Reading |
|---|---|
| Topline | +2.1pp faster time-to-first-hypothesis — modest |
| Significance | p = 0.03, CI [+0.4pp, +3.8pp] — real, but wide |
| Segment | Tier 1 (design-partner) tenants: **+9.6pp**. Tier 3 tenants: **−2.4pp** |
| Quality | Tier 1's accepted-hypothesis rate held; Tier 3's dropped — the early suggestion was distracting them from the runbook they'd have picked anyway |
| Leading indicator | Tier 1 repeat-use of the early-suggest flow: 71% within a week |

**Call:** ship to Tier 1–2 only; gate Tier 3 behind opt-in until the
Tier-3-specific runbook-matching signal improves.
