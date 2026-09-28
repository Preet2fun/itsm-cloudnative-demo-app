# Play — Account Scoring

**Purpose:** score an account (or a list) against the ICP, assign a tier, and
name the next action. Runs the model in
[`../account-scoring.md`](../account-scoring.md).

**Run:**
```
Read gtm/plays/account-scoring.md and score <company.com>
Read gtm/plays/account-scoring.md and score, table sorted by score, Tier 1 flagged:
<paste list>
```

**Inputs:** account name / domain / any known firmographic + technographic data;
[`../account-scoring.md`](../account-scoring.md) (point tables + gates);
[`../icp-tiers.md`](../icp-tiers.md) (criteria);
[`../signal-library.md`](../signal-library.md) (signal points + decay).

**Do:**
1. Gather what's needed for the three ICP-fit categories (firmographic,
   technographic, organizational) — mark any field you inferred.
2. Score Part 1 (0–70) and Part 2 (signal points, decayed, capped 30).
3. **Apply the hard gates** — suppression rule fires → Exclude; disqualifier
   present → cap at Tier 4; Tier-1 score but no live Tier-1 behavioural signal →
   treat as Tier 2.
4. Assign the tier; write what qualifies, what reduces the score, the next
   action, and the re-score trigger.

**Produce:**
- Single account → `outputs/YYYY-MM-DD-scoring-<name>.md` in the
  `../account-scoring.md` output format.
- Batch → one table sorted by total descending, Tier 1 flagged, saved to
  `outputs/YYYY-MM-DD-scoring-<list-name>.md`.

*Worked example:* [`../examples/2026-08-11-scoring-q4-target-list.md`](../examples/2026-08-11-scoring-q4-target-list.md)
(6 fictional accounts, incl. the two hard-gate exclusions).

**Gate:** every account has a tier, a next action, and a re-score trigger ·
disqualifiers explicitly checked · inferred fields marked · no account scored
Tier 1 without a live Tier-1 signal.
