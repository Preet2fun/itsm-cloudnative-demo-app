# Battlecard: Datadog

**One-line:** The broad observability leader; agentic RCA via Bits AI SRE and
Bits Investigation, plus Cloud SIEM and a Bits Security Analyst as **separate
products**.
**Market position:** Leader. **Typical buyer:** platform / SRE teams with
specialists and budget; security bought separately by a security team.

## Their strengths (be honest)

- Mature, broad platform; agentic RCA is real and shipping (iterative hypotheses,
  telemetry gathering, first-draft post-mortems, memory of past alerts).
- Enormous integration surface and mindshare — "nobody got fired for Datadog."
- Bits Chat / Investigator: strong day-to-day UX.

## Their weaknesses (for our ICP)

- **Security is a separate product line** (Cloud SIEM, Bits Security Analyst) —
  separate cost, often a separate buyer. The unified-budget / one-team problem is
  not something Datadog solves; it's something Datadog's pricing model creates.
- **Cost at scale** — the renewal shock is the #1 Tier-1 signal
  ([`../signal-library.md`](../signal-library.md)).
- Built for teams with an SRE function and a security team. Our ICP has neither.

## Why an ICP account switches

- One platform and one budget for uptime *and* security, run by the team they
  already have.
- The renewal is up and there's no separate security budget to absorb it.
- They want the "attack or outage" question answered in the same place as the
  traces, not in a second product.

## Objection handling

> **"We already use Datadog / Bits does this."**
> Bits is strong on the observability side — no argument. The gap for a team your
> size is that answering "was this an attack" means a second product, a second
> line item, and usually a second team. We do the investigation across both from
> one sensor and one budget. When's your renewal?

## Detect the account uses them

- `dd-agent` / `datadoghq` in tech-stack fingerprint or job posts
- Job posts mentioning "Datadog cost", "observability spend", "consolidation"
- Community posts about renewal pricing
