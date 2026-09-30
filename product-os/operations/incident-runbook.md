# Incident Runbook

What Ockham — the vendor — does when **its own platform** has an incident.
This is the dogfooding case: Ockham's SaaS going down or degrading, not a
customer's incident inside their own observed environment (that's the problem
Ockham's product exists to help a customer *with*, an entirely different
thing from Ockham *having* one).

---

## Severity levels

| Severity | Definition | Response target | Who's paged |
|---|---|---|---|
| **SEV1** | Platform down or data-integrity risk for any tenant; AI agent producing confidently-wrong output that reached a real customer | Page immediately, ack in 15 min | Incident Commander + on-call engineer + founder/PM |
| **SEV2** | Degraded for a subset of tenants or one feature area; AI agent unavailable but nothing wrong is being told to customers | Ack in 1 hour | On-call engineer; IC if not resolved in 2 hours |
| **SEV3** | Cosmetic, single-tenant, or internal-only; no customer-visible harm | Next business day | Logged, triaged at standup |

A **SEV1** triggered by the AI agent itself (not infra) is logged in
[`failure-triage-log.md`](failure-triage-log.md) as **wrong and confident**
in parallel with this runbook — the two aren't a choice, they run together.

---

## Roles

- **Incident Commander (IC)** — owns the timeline and the call to resolve;
  does not personally fix anything.
- **On-call engineer** — investigates and mitigates.
- **Comms owner** — customer-facing updates, status page, direct outreach to
  affected tenants.

*(No real on-call rotation exists yet — pre-launch, single-team. This section
holds the shape for when one does.)*

---

## Runbook steps

1. **Detect** — via `agent-reliability-monitoring.md`'s escalation triggers,
   platform-app's own observability stack, or a customer report routed
   through [`feedback-routing.md`](feedback-routing.md) step 1.
2. **Declare** — assign severity, name an IC, open the incident channel.
3. **Mitigate** — stop the bleeding first (rollback, feature-flag off per
   `context-hub/feature-flag-rollouts.md`'s staged-rollout mechanism,
   disable the specific AI capability) — root cause comes after.
4. **Resolve** — confirm the mitigation holds; stand down.
5. **Postmortem** — required for every SEV1, optional-but-encouraged for
   SEV2. Template below.

---

## Postmortem template

- **What happened** — plain description, timeline with timestamps.
- **Customer impact** — which tenants, what they saw, for how long.
- **Root cause** — label **HYPOTHESIS:** if not fully confirmed at write
  time; the same honesty discipline `ai-feedback/` and
  `failure-triage-log.md` use.
- **What caught it** — automated monitoring, or a customer report (if the
  latter, that's itself a finding — detection gap).
- **Action items** — owner + date each; a postmortem with no owned action
  items didn't do its job.
- **Feeds forward** — if this incident is the kind of thing
  `../ai-feedback/lenses/launch-feedback.md` would classify post-launch
  (Regressed / Adjacent regression), note it here so the next launch-feedback
  run picks it up rather than starting from zero.

---

## Upstream

[`agent-reliability-monitoring.md`](agent-reliability-monitoring.md),
[`failure-triage-log.md`](failure-triage-log.md),
[`feedback-routing.md`](feedback-routing.md) (three different ways an
incident gets detected).

## Downstream

[`../ai-feedback/lenses/launch-feedback.md`](../ai-feedback/lenses/launch-feedback.md)
(post-launch theme classification picks up a resolved incident's aftermath),
`../ai-launch-strategy.md` (a pattern of SEV1s is Red-cell evidence for AI
Reliability, not a one-off to discount).

## Status

Framework only — no real incident has happened yet (pre-launch, nothing in
production to have an incident in).
