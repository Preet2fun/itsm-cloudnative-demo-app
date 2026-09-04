# Play — Weekly GTM Update

**Purpose:** keep `gtm/` accurate without it feeling like a second job. Handles
the diff — what changed since last week — not a rewrite.

**Run:** `Read gtm/plays/weekly-update.md and run the weekly GTM update`
(Monday morning).

**Inputs (read first):** [`../README.md`](../README.md) § Status /
priorities; [`../signal-library.md`](../signal-library.md) § Performance Log +
last-updated; [`../account-scoring.md`](../account-scoring.md) § Calibration Log;
[`../icp-tiers.md`](../icp-tiers.md) § Evolution Log; all
`../outputs/campaigns/*/results.md`; any `../outputs/*` from the last 14 days.

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
3. **Apply on confirm** — after the user approves, write the changes to the files.
   Never invent performance data; if a number isn't in the repo, ask.
4. **Log** — one line to `../outputs/weekly-log.md` (create if absent):
   `YYYY-MM-DD: Updated <files>. <one sentence on the most significant change>.`

**Produce:** edits applied to `gtm/` files + a `weekly-log.md` entry. No separate
output file.

*Worked example:* [`../examples/weekly-log.md`](../examples/weekly-log.md) +
[`../examples/signal-performance-log.md`](../examples/signal-performance-log.md)
(fictional).

**Gate:** every stale section is either updated or has an open question logged ·
no invented numbers · changes applied only after confirmation.
