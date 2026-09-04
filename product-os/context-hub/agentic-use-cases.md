# Agentic Use Cases — What Our AI Layer Performs

## Ops / SRE agents

| # | Use case | One-liner | Shipping precedent |
|---|---|---|---|
| 1 | **Alert triage** | Triages every alert before the responder logs in and decides what's real | Datadog Bits AI SRE; ServiceNow; Edge Delta |
| 2 | **Autonomous RCA** | Forms hypotheses, gathers telemetry, pinpoints the cause end to end with linked evidence | Datadog Bits Investigation; Dynatrace; Edge Delta |
| 3 | **Latency investigation** | Isolates the bottleneck in a latency spike without a manual trace hunt | Datadog APM Investigator |
| 4 | **Change-correlated regression** | Ties the regression to the deploy or config change that caused it | Partial at Datadog / Dynatrace — ours is stronger |
| 5 | **Ownership routing** | Assigns the right owner and keeps all parties on one status | Datadog Bits AI SRE |
| 6 | **Incident comms** | Writes the running incident summary and the post-mortem first draft | Datadog; Edge Delta |
| 7 | **Similar-incident recall** | Recognizes this as something seen before and reuses that resolution | Datadog Bits (memory of past alerts) |
| 8 | **Proactive recommendations / prevention** | Finds the slow query or bad code path before users feel it; acts at config level | Dynatrace; Datadog Proactive App Recommendations |
| 9 | **SLO burn investigation** | Explains *why* the error budget is burning, not just that it is | Adjacent — we have the SLO module |
| 10 | **Remediation** | Executes or proposes the fix, not just the diagnosis; matches RCA to a validated runbook — one approval away | Dynatrace; Datadog |

## AI SOC — cloud only

| Use case | Behaviour | Precedent |
|---|---|---|
| **CDR signal triage** | Autonomously triages Cloud Detection and Response signals, investigates potential threats, delivers reasoned resolution recommendations | Datadog Bits Security Analyst; Dropzone.ai |
| **AI Security Operations Engineer** | Policy checks, misconfiguration scans, suspicious auth pattern detection, exposure mapping. Worked example: on unusual CloudTrail API activity — correlates with recent IAM changes, checks whether affected resources handle sensitive data, validates against compliance policies, matches against known attack signatures | Dropzone AI Security Engineer |
| **AI chat** | Day-to-day operations — create dashboards, update notebooks, investigate without rebuilding queries | Datadog Bits Chat |

## The moat line

> A security agent that knows **which misconfiguration is on the service carrying
> live traffic** — running where your data already lives.

We have both operations and security data in one place. The security agent
inherits application traces and infrastructure state as context the moment a
detection fires — see [`ebpf-signal-thesis.md`](ebpf-signal-thesis.md).
