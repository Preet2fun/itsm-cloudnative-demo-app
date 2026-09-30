# Operations

Day-2 production support once something has shipped and scaled: monitoring
Ockham's own AI-feature reliability in the field, triaging its failures, and
routing customer-reported issues back into the modules that act on them.

This is a genuine PDLC phase, not a placeholder. Two pieces of it already
existed elsewhere, each inside the folder that owns their underlying
machinery, so they aren't duplicated here; the other four pieces — the actual
gap — are now built directly in this folder.

## Already covered, elsewhere

- **Qualitative pre/post-launch read** —
  [`../ai-feedback/lenses/launch-feedback.md`](../ai-feedback/lenses/launch-feedback.md)
  — 90-day pre-launch risk scan (workflow disruption, adjacent-feature risk,
  segment pushback, expectation gaps); post-launch before/after theme
  comparison (Improved / Regressed / Mixed / No change / Adjacent regression /
  New theme).
- **Quantitative post-launch decision** —
  [`../data-analysis/experiment-analysis.md`](../data-analysis/experiment-analysis.md)
  — the ship/iterate/kill framework: topline → statistical significance →
  segment analysis → quality metrics → leading indicators.

A real post-launch review runs both together: qualitative theme shift from
`launch-feedback`, quantitative verdict from `experiment-analysis.md`. Neither
lens/artifact moves here — `launch-feedback` shares its agent, data-source,
and output-contract machinery with the other 5 `ai-feedback/` lenses;
`experiment-analysis.md` sits alongside `impact-estimation.md` and the rest of
`data-analysis/`'s quantitative toolkit. Moving either would break that.

## Built — the actual gap, now closed

Ongoing production support that neither of the two pieces above covers —
matching `product-os/README.md`'s lifecycle table, which already names a
"Support · Ops · SRE Agent" as the eventual owner of this phase:

- [`agent-reliability-monitoring.md`](agent-reliability-monitoring.md) — how
  Ockham watches its own AI agent's reliability in the field: accuracy /
  groundedness trend, hallucination rate (→ AI Reliability cell), latency,
  cost per investigation (→ AI Infrastructure cell) — the product/ops-facing
  consumption layer on top of `ai-engine/`'s already-built Langfuse scoring,
  not a second eval spec.
- [`failure-triage-log.md`](failure-triage-log.md) — severity classes
  (Cosmetic / Wrong-but-caught / Wrong-and-confident / Missed detection), the
  entry template, and one illustrative sample row.
- [`feedback-routing.md`](feedback-routing.md) — the actual decision tree
  from a customer report to: engineering's bug tracker, this triage log,
  `../ai-feedback/` (signal-scan / theme-roadmap-review), or a flag for
  `../ai-product-strategy/` — not left sitting in a support queue.
- [`incident-runbook.md`](incident-runbook.md) — severity levels, roles, the
  detect→declare→mitigate→resolve→postmortem flow, and the postmortem
  template — Ockham's own incidents, distinct from a customer's incident
  inside their own observed environment.

All four are frameworks with one illustrative example each where relevant, not
live operational data — there's nothing in production to generate real
numbers from yet (pre-launch).

## Upstream

[`../ai-feedback/`](../ai-feedback/), [`../data-analysis/`](../data-analysis/),
[`../ai-launch-strategy.md`](../ai-launch-strategy.md).

## Status

Built, 2026-09-30 — named per `ai-pdlc-playbook.md` §9's option (b). Two of
the module's real pieces live elsewhere (see above, cross-referenced not
duplicated); the four artifacts that were the actual gap are now written, each
a framework ready for real data once there's a production agent to generate
it.
