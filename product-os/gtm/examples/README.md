# Examples — worked GTM data

> **SAMPLE DATA — fictional accounts, illustrative numbers.** Not real prospects
> or results. Every company name here is invented. Replace with live data once
> there's a real outbound motion feeding `gtm/` (and once the AI feature is
> generating signals). Mirrors the starter kit's `examples/sample-company/`.

This folder shows what a *populated* GTM repo looks like — so the plays,
scoring model, and signal library are legible before any real campaign runs.

## What's here

| File | What it demonstrates |
|---|---|
| [`accounts.md`](accounts.md) | 6 fictional prospect companies — profile + which signals fired |
| [`2026-08-11-scoring-q4-target-list.md`](2026-08-11-scoring-q4-target-list.md) | A batch [`account-scoring`](../plays/account-scoring.md) output — the 6 accounts scored, tiered, with breakdowns and the two hard-gate exclusions |
| [`2026-08-14-research-meridian-freight.md`](2026-08-14-research-meridian-freight.md) | A full [`account-research`](../plays/account-research.md) brief on the top Tier-1 account |
| [`campaign-renewal-price-shock-tier1/`](campaign-renewal-price-shock-tier1/) | A complete campaign from [`signal-to-sequence`](../plays/signal-to-sequence.md): `brief.md` · `sequences.md` · `metrics.md` · `results.md` (3 weeks of sample performance) |
| [`signal-performance-log.md`](signal-performance-log.md) | A filled version of `signal-library.md` § Performance Log |
| [`weekly-log.md`](weekly-log.md) | 3 sample [`weekly-update`](../plays/weekly-update.md) entries |

## What you can learn from it

- **The scoring model saturates near the top** for curated ICP accounts (fit
  points cluster at ~60–70 / 70). Real differentiation comes from *which
  behavioural signal is live and how fresh it is* — see NorthGate (high score,
  no Tier-1 signal → Tier 2) and Kettle & Byte (was Tier 1, decayed to Tier 2).
  This is a candidate calibration for `account-scoring.md`.
- **The hard gates override the score** — Aperture Labs (staffed SOC + SIEM) and
  Quillstone (majority on-prem) score into Tier 3 on points but are
  Exclude / Tier 4.
- **Signal decay is visible** in `campaign-.../results.md` and `weekly-log.md`.
- **PVP copy** — every first touch in `sequences.md` still carries value with the
  CTA removed.

## The real `../outputs/` stays empty

`../outputs/` fills with real briefs and campaigns once plays run against real
accounts. This folder is illustrative only and is not part of the feedback loop.
