# Positioning

## Draft positioning statement (to react to / refine)

> For mid-market and enterprise IT teams where one group owns both service
> reliability and security posture, **Ockham** is the observability platform
> that autonomously correlates MELT telemetry with SIEM, vulnerability, and
> cloud posture signals to produce a single root cause — unlike Datadog and
> Dynatrace, which require separate security products, separate budgets, and
> separate teams to reach the same answer.

## The wedge

The wedge is the **unified budget and unified team**, not the unified feature
list. Datadog can technically do all of this. What it can't do is be affordable
and operationally simple for a 40-person IT org with no SOC. That's a
**structural advantage, not a feature race.**

## Core pitches by buyer

### Economic buyer — CIO, IT Director

> We're a unified observability and security operations platform. When something
> breaks, our agents investigate across your telemetry, your security signals,
> and your change history, then tell you what caused it — and whether it was an
> attack. One platform, one team, one budget, instead of four tools and two org
> charts.

### Technical buyer — VP Engineering, Head of SRE, IT Ops lead

> The 45 minutes your on-call spends reconstructing what happened — pulling
> traces, checking what deployed, ruling out a security event — is work our agent
> has already done by the time they open the incident. They start from an
> evidence-backed timeline instead of an empty query bar. Nobody writes
> correlation rules anymore.

### Security lead (when present)

> Your analyst's first twenty minutes on an alert is asking whether it's real —
> pulling context from systems they don't own and people who aren't awake. Our
> agent has the application traces and the infrastructure state in the same place
> as the detection, so triage starts with the answer to "was this actually
> anything." The false positives close themselves.

## Proof chains — the anti-hallucination line

The live buyer objection to agentic RCA is hallucination. Answer it
structurally, not with reassurance:

> The agent doesn't guess. It hands you a timeline with linked evidence — the
> trace ID, the correlating log error, and the RUM latency spike that prove it.
> If you disagree with the conclusion, you can check its work.

**"You can check its work"** is the phrase. Dynatrace runs the same play with
"deterministic AI" — the message is validated in this market, a reason to use
it, not avoid it.

## Runbook close — the follow-on line

> Finding the cause is half of it. The agent matches the RCA to a validated
> runbook you already wrote, so the fix is one approval away, not one more
> meeting.

## Metric rules

- Frame MTTR as **time-to-first-hypothesis**, not time-to-resolution. Resolution
  depends on the customer's change process, which we don't control. Alert →
  ranked, evidence-backed hypothesis is entirely ours and is measurable in a POC.
- **Never say "in seconds."** Say what it produces, not how fast. Speed claims
  invite stopwatch tests.
- A ranked hypothesis with evidence is still useful when it's second-best. "The
  exact root cause" is either right or it's a failure — don't take that bet.
