# Agent Reliability Monitoring

How Ockham watches its own AI agent's reliability once it's running in
production — the "who watches the watcher" layer.

**This is not a second eval spec.** The actual measurement mechanism already
exists and is fully specified in `ai-engine/CLAUDE.md` §3–4: every graph node,
tool call, and LLM call emits a Langfuse trace; every production run is scored
by automated scorers plus captured human feedback; a regression ("score drop,
latency/cost drift") feeds back into the offline eval suite as a new fixture,
closing the loop — all CI-gated, all engineering-owned. This document is the
**product/ops-facing consumption layer** on top of that: what Product watches,
what triggers a review, and how a sustained regression changes a product
decision. It never re-specifies the scoring mechanism itself.

---

## What Operations watches

Four Langfuse-sourced signals, each routed to a different place:

| Signal | Source | Watched for | Routes to |
|---|---|---|---|
| **Accuracy / groundedness score trend** | Langfuse automated scorers | a sustained drop, not single-run noise | AI Launch Strategy Canvas — **AI Reliability** cell |
| **Hallucination rate** | Langfuse automated scorers (citation-grounding check) | any non-zero rate reaching a real user, not just an offline-fixture miss | AI Launch Strategy Canvas — **AI Reliability** cell; a confirmed instance → [`failure-triage-log.md`](failure-triage-log.md) |
| **Latency** (time-to-first-hypothesis, time-to-resolution-recommendation) | Langfuse trace timing | drift against the SLO set in the PRD's addendum F | AI Launch Strategy Canvas — **AI Infrastructure** cell |
| **Cost per investigation** | Langfuse cost attribution | drift against the unit-economics model | AI Launch Strategy Canvas — **AI Infrastructure** cell |

The canvas split matters — accuracy/hallucination and latency/cost are
scored by the same engineering pipeline but they answer two different launch
questions (`ai-launch-strategy.md`: *does it work* vs. *can you afford to run
it at scale*). Don't collapse them into one number.

---

## Review cadence

- **Weekly** — a digest of the four signals against their thresholds. No
  action needed if all four are stable; this is a pulse check, not a meeting.
- **At each `ai-launch-strategy.md` re-score** (§"When to run it" in that
  doc) — the trend since the last re-score is the evidence line for the AI
  Reliability and AI Infrastructure cells. A cell doesn't move from Red to
  Yellow on a claim; it moves on this trend data.

## What triggers escalation

- A single hallucination reaching a real user (not caught by the agent's own
  confidence framing) — always escalates, regardless of trend, per
  `ai-engine/CLAUDE.md`'s "no silent drift" principle → log it in
  [`failure-triage-log.md`](failure-triage-log.md).
- Three consecutive weekly digests showing the same signal degrading — treat
  as a trend, not noise; escalate to the eval owner even if no single event
  was severe enough to triage on its own.

---

## Upstream

[`../../ai-engine/CLAUDE.md`](../../ai-engine/CLAUDE.md) §3–4 (the actual
scoring mechanism), [`../ai-launch-strategy.md`](../ai-launch-strategy.md)
(the AI Reliability / AI Infrastructure cells this feeds).

## Downstream

[`failure-triage-log.md`](failure-triage-log.md) (confirmed failures),
`ai-prd/` stage 06 + addendum E/F (where reliability and cost targets are set
in the first place).

## Status

Framework only — no live Langfuse data exists yet (pre-launch; `ai-engine/`'s
eval suites are specified but nothing has run in production). The four
signals and their routing are ready to receive real numbers the moment
there's a production agent to score.
