# Persona: VP Engineering / Head of SRE / IT Ops Lead

## Overview

**Titles:** VP Engineering, Head of SRE, Head of Platform, IT Operations Lead,
Infrastructure Lead.
**Seniority:** Manager / Director / VP.
**Decision role:** **Technical buyer / evaluator.** Runs the POC; their thumbs-up
is the gate.
**Found at:** the same accounts — often the person the IT Director delegates the
evaluation to; sometimes the champion who brought Ockham in.

## What they care about

- **Primary metric:** MTTR, incident volume, on-call health, deploy frequency.
- **Biggest problem right now:** on-call spends 45 minutes reconstructing what
  happened — pulling traces, checking the last deploy, ruling out a security
  event — before they can act. Correlation rules rot. The "is this security?"
  tangent derails incidents.
- **Good week:** incidents resolved fast, on-call slept, no correlation-rule
  maintenance, a clean deploy train.
- **Bad week:** a multi-hour incident with a war room; a repeat of a problem the
  runbook should have caught.

## How they buy

- **Involvement:** influences heavily; can veto. Owns the POC.
- **Discovery:** technical content, Hacker News / Reddit, Slack communities,
  docs. Reads before they talk to sales.
- **Evaluation style:** hands-on. Wants it on their own telemetry, wants to see
  the eBPF overhead, wants to read how the agent reaches a conclusion.
- **Common objections:**
  - "Another agent on my nodes." → eBPF overhead numbers; one sensor replacing
    several.
  - "We've built our own correlation." → the maintenance cost of that, and what
    it doesn't cover (security signals).
  - "Black-box AI." → the linked-evidence timeline: trace ID, correlating log
    error, the metric spike that proves it.

## How to reach them

- **Best channel:** technical content and docs first; LinkedIn; community Slacks;
  a technical peer's recommendation.
- **What gets attention:** a specific, real on-call pain; architecture detail;
  "nobody writes correlation rules anymore."
- **What gets ignored:** marketing claims without specifics; ROI language; demos
  that don't touch real data.

## Message framework

- **Value prop:** "Your on-call starts every incident from an evidence-backed
  hypothesis instead of a blank query bar — across ops *and* security."
- **Proof points:** the linked-evidence timeline; eBPF overhead; time-to-first-
  hypothesis on their own POC data; the "attack or outage" tangent removed.

## Sample outreach hook

> Post-mortems that spend a paragraph on "was this an attack" usually mean the
> on-call didn't have security context in the same place as the traces. The
> agent has the traces, the infra state, and the detections together by the time
> someone opens the incident — that's the reconstruction half-hour, gone.
