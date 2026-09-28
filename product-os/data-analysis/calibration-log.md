# Calibration Log

Closes the loop [`impact-estimation.md`](impact-estimation.md) (pre-build
Expected Lift guess) and [`experiment-analysis.md`](experiment-analysis.md)
(post-launch measured lift, from its ship/iterate/kill call) leave open on
their own: nothing currently records how far off a prediction was, so the
next feature's guess starts from zero every time.

One row per shipped feature, added **after** `experiment-analysis.md`'s
ship/iterate/kill call — never before; there's no "measured" number until
that call has been made.

---

## When to read this file

Before filling in `impact-estimation.md`'s **Expected Lift** row for a new
feature: check here first for a comparable prior feature. If one exists, use
its **measured lift** (adjusted for known differences) instead of a bare
guess, and cite it `[Data: calibration-log.md, feature: <slug>]` — this is
the real artifact behind impact-estimation.md's top-ranked Expected-Lift
source ("a prior Ockham experiment"), which otherwise has nothing concrete to
point at.

## When to write to this file

After `experiment-analysis.md` reaches its ship/iterate/kill call for a
feature: append one row. Every value already exists in the two source docs —
this is transcription and arithmetic, never a new invented number.

## The log

| Feature / slug | Predicted lift (scenario, tag) | Measured lift | Ratio (measured ÷ predicted-realistic) | Note |
|---|---|---|---|---|
| `ai_drafted_resolution_notes` (SAMPLE) | Realistic: +15pp `[Assumed: analogous RCA-adoption pattern]` (`impact-estimation.md` worked example) | +8pp (18%→26%, Tier 1–2 only; Tier 3 not yet rolled out) | **0.53×** — overshot by roughly 2× | Predicted off an analogous adoption pattern, not this product's own data — no prior to anchor to at the time. Segment-only result (Tier 1–2): don't apply this ratio to a fleet-wide prediction next time; note the segment scope alongside the ratio. |

> The row above is illustrative — paired with `impact-estimation.md`'s own
> SAMPLE worked example and `experiment-analysis.md`'s runbook-match example
> in shape, not literally chained from one to the other (their numbers don't
> share one real experiment). Replace with a real row the first time an
> actual feature completes its ship/iterate/kill call.

## Org-level read (once a few rows exist)

A single derived line, updated whenever a new row lands:

> **Median predicted ÷ measured ratio across all rows so far: —** (not yet
> computable — needs ≥3 real rows to mean anything; a single row is an
> anecdote, not a calibration signal)

If that median settles well below 1.0 over time, Ockham's own Discovery/PRD
forecasts run optimistic on average — worth a correction-factor note in
`impact-estimation.md`'s Do/Don't section once there's enough data to state
one. If it settles above 1.0, the org is sandbagging its own estimates.
Either way: state it, don't average it away, same discipline as the
three-scenario rule.

## Do / Don't

**Do:** write the row the same day the ship/iterate/kill call is made, while
the context (which segment, what surprised you) is still fresh; carry the
segment scope forward with the ratio, not just the bare number; treat a
`[Gated]`-tagged prediction's ratio as less informative than one that started
`[Assumed]` — a Gated prediction was already hedged.

**Don't:** overwrite or delete a row because the prediction was embarrassing;
compute the org-level median off fewer than 3 rows and state it as if it
means something; apply one feature's ratio to a completely different kind of
feature (e.g. an adoption-rate miss on a UI feature says little about a
latency-reduction feature's likely miss).
