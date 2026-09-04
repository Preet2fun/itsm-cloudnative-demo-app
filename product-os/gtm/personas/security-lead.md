# Persona: Security Lead

*Present in only some deals — the first security hire into an IT/platform team,
or a security-minded platform engineer who has picked up the mandate. There is
**no CISO** (if there were, the account is out of ICP —
[`../icp-tiers.md`](../icp-tiers.md)).*

## Overview

**Titles:** Security Engineer, Cloud Security Engineer, Head of Security (first
one), Security-minded Platform Engineer.
**Seniority:** IC / Manager.
**Decision role:** **Influencer / evaluator** on the security capability. Rarely
the economic buyer at this company size.
**Found at:** ICP accounts that just made their first security hire (a Tier-1
signal) or have a compliance deadline forcing the issue.

## What they care about

- **Primary metric:** mean-time-to-triage, false-positive rate, coverage /
  posture score, audit readiness.
- **Biggest problem right now:** the first 20 minutes of every alert is "is this
  real?" — pulling context from systems they don't own and people who aren't
  awake. No SIEM, no team. Expected to produce audit evidence on demand.
- **Good week:** alerts triaged fast, false positives closed themselves, posture
  drift caught before the auditor found it.
- **Bad week:** an alert storm they can't work through; an audit request they
  can't answer without a week of manual evidence-gathering.

## How they buy

- **Involvement:** evaluates the detection quality and the compliance fit;
  advises the IT Director.
- **Discovery:** security communities, LinkedIn, compliance-focused content,
  peers in similar no-SOC roles.
- **Evaluation style:** wants to see detection precision, the evidence chain, and
  the mapping to their framework. Wary of ops tools bolting on security.
- **Common objections:**
  - "You're an observability company doing security on the side." → the
    shared-sensor architecture; the CDR / CSPM / VM scope; it's not a bolt-on,
    it's the same runtime data.
  - "Will this satisfy my auditor?" → compliance mappings + evidence export.
  - "I need a SIEM." → most teams your size don't stand one up; detection where
    the telemetry already is, without the SIEM operational load.

## How to reach them

- **Best channel:** security / cloud-security communities, LinkedIn,
  compliance-deadline-timed content.
- **What gets attention:** "first 20 minutes asking is this real"; shared-
  telemetry triage; concrete compliance-framework mappings.
- **What gets ignored:** SIEM-replacement positioning; generic "AI SOC analyst"
  claims without the evidence chain.

## Message framework

- **Value prop:** "Detection where the telemetry already is — triage starts with
  'was this actually anything', and the false positives close themselves."
- **Proof points:** the evidence chain (CloudTrail event → correlating IAM change
  → asset sensitivity → policy check); compliance mappings; the eBPF runtime
  signal that turns theoretical risk into observed risk.

## Sample outreach hook

> First 90 days owning security with no SOC behind you is when you decide what to
> stand up. Most teams your size don't stand up a SIEM — they put detection where
> the traces and infra state already are, so triage starts with the answer to
> "is this real."
