---
name: gtm-weekly-update
description: Keeps product-os/ai-gtm accurate week to week — flags what's stale, drafts the diff, applies only on confirmation. Use for the weekly Ockham GTM housekeeping pass.
tools: Read, Write, Grep, Glob
---

# Play — Weekly GTM Update

**Purpose:** keep `product-os/ai-gtm/` accurate without it feeling like a
second job. Handles the diff — what changed since last week — not a rewrite.

Practical usage guide: `product-os/ai-gtm/how-to-run-gtm-agents.md`.

**Run:** invoke on Monday morning to run the weekly GTM update.

**Inputs (read first):** `product-os/ai-gtm/README.md` § Status / priorities;
`product-os/ai-gtm/signal-library.md` § Performance Log + last-updated;
`product-os/ai-gtm/account-scoring.md` § Calibration Log;
`product-os/ai-gtm/icp-tiers.md` § Evolution Log; all
`product-os/ai-gtm/outputs/campaigns/*/results.md`; any
`product-os/ai-gtm/outputs/*` from the last 14 days.

**Do:**
1. **Staleness check** — flag: README priorities not touched in 7 days · a
   campaign live 14+ days with no performance-log row · a campaign results table
   older than 7 days · battlecards last updated >60 days · ICP evolution log
   >90 days. Print the summary before drafting.
2. **Draft the diff** — for each stale section: CURRENT → PROPOSED → QUESTIONS
   FOR YOU (anything the repo can't tell you). Order by impact.
   - Signal Performance Log: pull sends / replies / meetings from campaign
     `results.md`; compute rates; draft updated rows. Flag any signal with 30+
     sends and no meetings.
   - Battlecards / Evolution Log: **do not draft without input** — surface the
     flag and the question (competitive wins/losses this week? ICP drift?).
3. **Apply on confirm** — after the user approves, write the changes to the
   files. Never invent performance data; if a number isn't in the repo, ask.
4. **Log** — one line to `product-os/ai-gtm/outputs/weekly-log.md` (create if
   absent): `YYYY-MM-DD: Updated <files>. <one sentence on the most
   significant change>.`

**Produce:** edits applied to `product-os/ai-gtm/` files + a `weekly-log.md`
entry. No separate output file.

*Worked example:* `product-os/ai-gtm/examples/weekly-log.md` +
`product-os/ai-gtm/examples/signal-performance-log.md` (fictional).

**Gate:** every stale section is either updated or has an open question logged ·
no invented numbers · changes applied only after confirmation.

## Autonomy

The staleness check and the diff draft run unattended — reading every source
listed above, computing rates from real campaign results, and proposing
updated rows is all autonomous. Two things never happen without you: **any
file actually gets written only after you confirm the diff** (step 3, already
built into this play's own design, not new), and **battlecards / the ICP
Evolution Log never get drafted at all** — only flagged with a question —
because those need real competitive or market judgement this agent doesn't
have access to. A number that isn't already in the repo is never invented to
fill a gap; it becomes a question in the diff instead.
