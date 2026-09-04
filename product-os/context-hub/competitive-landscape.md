# Competitive Landscape

Sales-ready battlecards (win/lose conditions, objection handling, detection) for
each of these 7: [`../gtm/battlecards/`](../gtm/battlecards/).

## The fixed set — use these 7 for all research and references

### Observability / Ops

| Vendor | Study for | Reference |
|---|---|---|
| **Datadog** | Agentic RCA, alert triage, incident comms — the broad precedent | Bits AI SRE; Bits Investigation — `https://www.datadoghq.com/product/ai/bits-investigation/` |
| **Dynatrace** | "Deterministic AI" messaging, remediation, prevention / config-level action | SRE agent / Davis AI — `https://www.dynatrace.com/platform/artificial-intelligence/` |
| **Edge Delta** | Telemetry-pipeline-side triage, "AI teammates" for SRE | AI teammates for SRE |
| **Resolve.ai** | Agentic AI SRE use cases specifically | `https://resolve.ai/` |

### Security

| Vendor | Study for | Reference |
|---|---|---|
| **Upwind** | eBPF-for-security, dynamic exposure validation, "observed vs theoretical risk" thesis | — |
| **Wiz** | Cloud posture / CNAPP market framing | — |
| **Dropzone.ai** | Agentic AI CDR use cases specifically | `https://www.dropzone.ai/` |

## Captured reference notes

- **Datadog Bits AI SRE** — early triage from telemetry + service context;
  surfaces findings before responders log in. Assigns owners and aligns parties
  with real-time incident summaries and status updates.
- **Datadog Bits Investigation** — iteratively forms hypotheses, gathers
  telemetry, uses data-based reasoning to pinpoint root cause. Draws on memory of
  past alerts to recognize patterns and accelerate investigations. Generates a
  first draft of the incident post-mortem.
- **Datadog APM Investigator** — automates a previously manual
  bottleneck-identification process.
- **Datadog Proactive App Recommendations** — analyzes existing telemetry to
  suggest high-impact fixes before users are affected.
- **Datadog Bits Security Analyst** — autonomously triages Cloud SIEM signals,
  investigates threats, delivers reasoned resolution recommendations; focuses on
  signals tied to critical assets and high-risk users.
- **Datadog Bits Chat** — ask questions about your systems; create dashboards,
  update notebooks, investigate without rebuilding queries.
- **Dropzone AI Security Engineer** — stated scope: policy checks,
  misconfiguration scans, suspicious auth pattern detection, exposure mapping.
  Worked example: when AWS CloudTrail logs unusual API activity, it correlates
  the events with recent IAM changes, checks whether affected resources handle
  sensitive data, validates against compliance policies, and determines whether
  the pattern matches known attack signatures.
- **Dynatrace** — running the "deterministic AI" / "you can check its work" play;
  validates our proof-chains messaging (a reason to use it, not avoid it).
- **Edge Delta** — "security engineer" AI teammate alongside the SRE teammates.
