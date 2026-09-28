---
name: gtm-account-scoring
description: Scores an account or list against the Ockham ICP, assigns a tier, and names the next action (product-os/ai-gtm). Use when scoring or tiering prospect accounts.
tools: Read, Write, Grep, Glob
---

# Play — Account Scoring

**Purpose:** score an account (or a list) against the ICP, assign a tier, and
name the next action. Runs the model in
`product-os/ai-gtm/account-scoring.md`.

Practical usage guide: `product-os/ai-gtm/how-to-run-gtm-agents.md`.

**Run:**
```
Score <company.com>
Score, table sorted by score, Tier 1 flagged: <paste list>
```

**Inputs:** account name / domain / any known firmographic + technographic data;
`product-os/ai-gtm/account-scoring.md` (point tables + gates);
`product-os/ai-gtm/icp-tiers.md` (criteria);
`product-os/ai-gtm/signal-library.md` (signal points + decay).

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
- Single account → `product-os/ai-gtm/outputs/YYYY-MM-DD-scoring-<name>.md`
  in `account-scoring.md`'s output format.
- Batch → one table sorted by total descending, Tier 1 flagged, saved to
  `product-os/ai-gtm/outputs/YYYY-MM-DD-scoring-<list-name>.md`.

*Worked example:*
`product-os/ai-gtm/examples/2026-08-11-scoring-q4-target-list.md`
(6 fictional accounts, incl. the two hard-gate exclusions).

**Gate:** every account has a tier, a next action, and a re-score trigger ·
disqualifiers explicitly checked · inferred fields marked · no account scored
Tier 1 without a live Tier-1 signal.

## Autonomy

Runs clean, start to finish. This is the most mechanical of the four GTM
plays — deterministic point tables and hard gates, not a judgement call like
Discovery's AI-native check or PRD's tier. Nothing here commits real
resourcing or reaches a real prospect; it's classification only. The one
discipline worth enforcing without exception: mark every inferred field, and
never let a hard-gate exclusion or cap get silently skipped because the rest
of the score looked strong.
