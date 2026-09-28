# Playbook: "Attack or Outage?"

**Trigger:** the *"Attack or outage?" incident* signal
([`../signal-library.md`](../signal-library.md)) — a public incident in the last
90 days whose write-up shows time lost distinguishing a security event from an
operational one.

**Situation:** they just lived the exact pain Ockham removes — the on-call
without security context in the same place as the traces, burning a war room on
"was this an attack." The internal urgency is real and datable.

## The play

1. Read the post-mortem. Note the **class** of the delay (couldn't rule out a
   security event; engaged security late; no shared timeline) — not the specifics.
2. Score the account. Target the **VP Eng / Head of SRE**
   ([`../personas/vp-engineering-sre.md`](../personas/vp-engineering-sre.md)).
3. Lead with the **reconstruction half-hour** and the tangent removed: the agent
   has the traces, the infra state, and the detections together by the time
   someone opens the incident.
4. Offer a POC on their own telemetry — replay a past incident, measure
   time-to-first-hypothesis.

## What to say

> Post-mortems that spend a paragraph on "was this an attack" usually mean the
> on-call didn't have security context in the same place as the traces. That's
> the half-hour we give back on the first pass — and you can check the evidence
> behind every step.

## What not to do

- **Don't reference their specific incident as if you have inside knowledge** —
  speak to the pattern ("post-mortems that…"), not "your outage on the 14th."
- Don't ambulance-chase within days of a live incident — wait until the
  post-mortem is public and the dust has settled.
- Don't promise the agent would have caught it — promise a faster, checkable
  first hypothesis.
