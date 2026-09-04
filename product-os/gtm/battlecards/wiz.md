# Battlecard: Wiz

**One-line:** The CNAPP category leader — cloud posture, agentless scanning,
attack-path analysis. Defines how the market frames cloud security.
**Market position:** Leader. **Typical buyer:** a CISO / cloud-security team at a
mid-to-large enterprise.

## Their strengths (be honest)

- Category-defining brand; broad posture coverage; excellent attack-path graph.
- Agentless is fast to deploy and land.

## Their weaknesses (for our ICP)

- **Security-only** — no observability, no APM, no incident investigation for
  ops.
- **Agentless** means less runtime signal — posture and config, not the live
  eBPF evidence Ockham uses to prioritise what actually matters.
- **Buyer is a CISO.** Our ICP has no CISO — an account that buys Wiz on CISO
  terms is drifting out of ICP ([`../icp-tiers.md`](../icp-tiers.md)).
- Enterprise-priced.

## Why an ICP account switches (or never buys Wiz)

- No CISO, no separate security budget — Wiz's motion doesn't fit.
- They want runtime eBPF evidence driving prioritisation, and the security
  capability converged with the ops platform one team already runs.

## Objection handling

> **"Isn't Wiz the standard for cloud security?"**
> For an enterprise with a CISO and a cloud-security team, sure. You have neither
> — you have one team owning uptime and security on one budget. Ockham gives that
> team CDR, posture, and vuln prioritisation driven by runtime eBPF evidence, in
> the same platform as the observability they already need.

## Detect the account uses them

- `wiz.io` integrations, "Wiz" in job posts / security-team titles
- Presence of a CISO / "Head of Cloud Security" → **lower the ICP score**
