# Playbook: Compliance Deadline

**Trigger:** the *Compliance deadline* signal
([`../signal-library.md`](../signal-library.md)) — a datable SOC 2 Type II window,
DORA (EU financial entities), HIPAA audit, ISO 27001, or a named large customer's
security questionnaire.

**Situation:** the obligation forces a posture + detection purchase on a clock,
and the ICP buyer can't stand up a SOC to meet it. They need coverage one team
can run and produce evidence from.

## The play

1. Identify the framework and the date. Note which requirements Ockham touches:
   runtime detection (CDR), posture (CSPM), vuln prioritisation (VM), and the
   evidence trail.
2. Score the account. Target the **IT Director** with the **security lead** on
   thread ([`../personas/security-lead.md`](../personas/security-lead.md)) if one
   exists.
3. Lead with **"evidence one team can produce on the timeline"** — map Ockham's
   outputs to the framework's control areas.
4. Timeline the POC to land before the audit / submission date. The evidence
   export is part of the POC success criteria.

## What to say

> [Framework]'s expectations don't care that you don't have a SOC — the question
> is whether one team can produce the audit trail on the date. Detection where
> your telemetry already is, plus posture and prioritisation on the same
> platform, gets you evidence without standing up a security programme first.

## What not to do

- **Don't claim certification.** Ockham produces controls and evidence; the
  auditor decides. Never "Ockham makes you SOC 2 / DORA compliant."
- Don't ignore the security lead — the IT Director will defer the technical
  security judgement to them.
- Don't let the POC slip past the deadline — a POC that finishes after the audit
  is worthless for this play.
