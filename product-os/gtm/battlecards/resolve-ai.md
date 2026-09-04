# Battlecard: Resolve.ai

**One-line:** Pure-play agentic AI SRE — an AI teammate that investigates
production incidents.
**Market position:** Niche / focused challenger. **Typical buyer:** companies
with an established SRE function and an on-call practice to augment.

## Their strengths (be honest)

- Focused, modern agentic SRE product; good investigation UX; built AI-native.
- Clear narrative — "an AI SRE that does the reconstruction work."

## Their weaknesses (for our ICP)

- **SRE-only. No security convergence.** The "attack or outage" question is out
  of scope.
- **Assumes an SRE function exists.** Our ICP explicitly has *no dedicated SRE* —
  the same engineers do platform work and incident response
  ([`../../context-hub/icp.md`](../../context-hub/icp.md)).
- No eBPF-shared-sensor / posture / vuln story.

## Why an ICP account switches

- Their team isn't an SRE team — it's one team doing platform, incident response,
  *and* security. They need coverage across all of it, not an SRE augment.
- They want the security half in the same investigation.

## Objection handling

> **"We're looking at Resolve.ai for incident investigation."**
> If you had a dedicated SRE team, that's a reasonable augment. You don't — one
> team owns uptime and security. Ockham does the same investigation work *and*
> answers whether it was an attack, from one sensor, for the team you actually
> have.

## Detect the account uses them

- Mentions in job posts / RFPs for "AI SRE", "agentic incident response"
- The account has an SRE function (which itself lowers ICP fit — check
  `../account-scoring.md`)
