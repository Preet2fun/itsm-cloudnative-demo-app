# Lens 6 — Launch Feedback

**Purpose:** know what you're walking into before a launch, and what actually
changed after.

**Question:** *(before)* What risk does the historical feedback show?
*(after)* What moved, per theme?

**Inputs:** the launch name / description; for post-launch, the launch date
(wait 14+ days after); the data source, with dates.

**Do — pre-launch (90-day scan):**
1. Four risk buckets: workflows this could disrupt · adjacent features that
   could be hit · segments likely to push back · gaps between what customers
   expect and what's shipping.
2. A risk matrix (likelihood × blast radius) + which segments to notify
   proactively.

**Do — post-launch (before vs after the date):**
Classify each affected theme:

| Class | Meaning |
|---|---|
| **Improved** | negative signal reduced or gone |
| **Regressed** | new or worsened signal introduced |
| **Mixed** | both improvement and regression |
| **No change** | no movement despite the launch touching this area |
| **Adjacent regression** | something nearby degraded although the target improved |
| **New theme** | a pattern that didn't exist before |

Flag **Adjacent regression** and **No change** first — the unintended-consequence
findings.

**Produce:** the risk matrix (pre) or the per-theme change table (post) · quotes
· Limitations (14-day floor for post-launch signal).

**Feeds:** `ai-prd/` §13 Rollout & Launch Plan (pre); `ai-launch-strategy.md` —
post-launch results re-score the Customer and AI-Reliability cells.
