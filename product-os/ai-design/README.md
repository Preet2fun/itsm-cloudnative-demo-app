# AI Design

Product design for an AI-native platform: how agent work is shown to humans so
they trust it and can override it.

## Expected artifacts (built on direction)

- `design-principles.md` — explainable autonomy; "you can check its work"
- `proof-chain-ui.md` — the evidence-linked timeline: trace ID, correlating log
  error, RUM latency spike; ranked hypotheses, not a single guess
- `approval-flows.md` — remediation and runbook execution as one approval, with a
  visible diff of what the agent will do
- `autonomy-controls.md` — per-capability autonomy dial (observe → suggest →
  act-with-approval → act), and how a customer ramps it
- `incident-workspace.md` — responder opens to an evidence-backed timeline, not
  an empty query bar
- `security-triage-view.md` — detection, application traces, infra state in one
  place; "was this actually anything"
- `chat-surface.md` — dashboard / notebook creation and investigation via chat

All screens are drafted in **Claude Design** first, per root `CLAUDE.md` §10,
then built to match.

## Upstream

[`../ai-prd/`](../ai-prd/), [`../context-hub/`](../context-hub/).

## Status

Scaffold only.
