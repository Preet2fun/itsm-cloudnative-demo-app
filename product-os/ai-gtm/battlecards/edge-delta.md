# Battlecard: Edge Delta

**One-line:** Telemetry-pipeline-first observability with "AI teammates" for SRE
(and a security teammate) — triage anchored at the pipeline / cost-control layer.
**Market position:** Challenger. **Typical buyer:** teams with a telemetry-cost
problem; log-volume pain.

## Their strengths (be honest)

- Strong pipeline / telemetry-cost story — process data at the edge, cut ingest
  bills.
- "AI teammates" framing for SRE is a good agentic narrative; a security teammate
  alongside it.

## Their weaknesses (for our ICP)

- **Pipeline-first, not investigation-first.** The teammate triages; it's not a
  converged ops+security investigation across telemetry, security signals, and
  change history.
- No eBPF-shared-sensor thesis feeding both APM and runtime security.
- Security is a teammate bolted alongside, not the same runtime data.

## Why an ICP account switches

- They want the full investigation — cause + "was it an attack" + linked evidence
  — not pipeline-stage triage.
- One sensor feeding both sides, not a pipeline tool plus separate security.

## Objection handling

> **"Edge Delta's teammates already do agentic triage."**
> Good for pipeline cost and first-pass triage. The question for a no-SOC team is
> what happens *after* triage — a ranked, evidence-linked hypothesis of the cause
> that also tells you whether it was an attack. That's an investigation across
> ops and security, from one sensor, not a teammate per stage.

## Detect the account uses them

- `edgedelta` in tech-stack fingerprint / Helm charts
- Job posts mentioning "telemetry pipeline", "log volume reduction", "Edge Delta"
