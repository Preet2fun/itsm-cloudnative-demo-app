# Messaging — the 5-Second Test

A homepage has ~5 seconds to answer one question: **what do you do, for whom, and
why should I care?** This doc holds Ockham's homepage hero copy and product
message, written to pass that test. It's the customer-facing distillation of
[`context-hub/positioning.md`](context-hub/positioning.md) — positioning is the
strategy, this is the words on the page. First pass; validate against real ICP
reactions before it ships.

Framework: Douwe Wester, *Ideal Customer Led GTM*.

---

## The rule

**The 5-second test.** A stranger reads only the headline + subheadline, then
answers:

1. Can I tell what the product actually does?
2. Can I tell who it's for?
3. Can I tell what outcome it delivers?

Miss even one → a messaging problem sitting between your traffic and your
pipeline.

**The format.**

> We help **[ideal customer]** do **[job to be done]** so they can
> **[desired outcome]**.

**Use-case positioning beats category positioning.** "Revolutionising workflow
management" could be anyone. "We help ops teams at logistics companies cut manual
reporting from 6 hours to 30 minutes" names the buyer, the problem, and the
outcome — specific enough that the ICP thinks *that's me*, and everyone else
scrolls (which is the point).

**Ockham guardrails** — from `context-hub/positioning.md` § Metric rules; keep
these in any rewrite:

- Never "in seconds." Say what it produces, not how fast.
- Frame time as **time-to-first-hypothesis**, not time-to-resolution.
- "**You can check its work**" — a ranked, evidence-linked hypothesis, never a
  single black-box answer.
- "AI-native" tells the build story; "AI-powered" is fine in ad copy.

---

## Ockham — the fill-in

> We help **IT teams that own both uptime and security, with no dedicated SOC**
> do **investigate an incident across observability and security signals in one
> place** so they can **start from an evidence-backed hypothesis instead of an
> empty query bar — on one team, one budget**.

---

## Website message — homepage hero

### Recommended

**Headline**
Your IT team runs uptime and security. Ockham runs the investigation — across
both.

**Subheadline**
An AI-native operations platform for companies without a SOC. One sensor feeds
your monitoring and your security tooling; when something breaks, the agents hand
your team a ranked hypothesis of the cause — with the linked evidence, so they
can check its work before acting.

**Proof line** (hero footer)
One budget instead of two. One team instead of a handoff. Every conclusion
traceable to a signal.

**CTA**
Watch it investigate a live incident →

### Alternates

**A — buyer-named (most specific)**
*Headline:* For IT teams without a SOC: one AI-native platform for uptime and
security.
*Subhead:* Ockham correlates the signals your monitoring and security tools see
separately and returns a ranked, checkable explanation of what broke — and
whether it was an attack. One team runs it. One budget pays for it.

**B — outcome-forward**
*Headline:* Find what broke — across observability and security — without
switching tools or paging a second team.
*Subhead:* Ockham's agents investigate your telemetry, security signals, and
change history the moment an incident opens, so your on-call starts from an
evidence-backed timeline, not a blank query bar.

### 5-second check on the recommended version

| Question | Answered by |
|---|---|
| What does it do? | "runs the investigation across [observability and security]" + subhead: correlates signals → ranked hypothesis with linked evidence |
| Who is it for? | "Your IT team [that] runs uptime and security" + "companies without a SOC" |
| What outcome? | subhead + proof line: a checkable hypothesis before acting; one budget, one team, no handoff |

### Avoid — sounds real, says nothing

- "The unified platform for operational excellence."
- "See everything. Secure everything." — who? what outcome?
- "Autonomous IT and security operations." — that's the *vision*
  (`context-hub/`), not a hero: no buyer, no present-tense outcome. Fine on an
  About page.
- Any headline with a number followed by "in seconds."

---

## Product message

**One-liner — "what is it"**
Ockham is an AI-native observability and security operations platform for
companies without a SOC. When an incident opens, its agents investigate across
telemetry, security signals, and change history, then tell you what caused it —
and whether it was an attack — with the evidence to check.

**Elevator — two sentences**
Mid-market IT teams increasingly own both uptime and security with no separate
SOC, and pay for a monitoring stack and a security stack that don't talk to each
other. Ockham is one platform, run by one team on one budget: the same eBPF
sensor feeds both sides, and agentic investigation returns a ranked,
evidence-linked hypothesis instead of two consoles full of alerts.

**In-product tagline options**
- Uptime and security. One investigation.
- The evidence, ranked.
- One team. One budget. One investigation.

---

## Use-case-positioned variants (campaign landing pages)

Same product, sharper "that's me" — pick the entry point per campaign:

| Entry point | Headline |
|---|---|
| Kubernetes-heavy teams | We help Kubernetes teams find the cause of an incident without paging a separate security person. |
| Budget consolidation (IT Director) | Replace a monitoring bill and a security bill with one platform your existing team can run. |
| Alert fatigue / lean security | Your first 20 minutes on an alert is "is this real?" — Ockham's agent answers that before your team opens the ticket. |

---

## Where this connects

- **Derived from** [`context-hub/positioning.md`](context-hub/positioning.md) —
  the positioning statement, the wedge, the buyer pitches, the proof-chain line.
- **Feeds** [`ai-launch-strategy.md`](ai-launch-strategy.md) Customer lens (does
  the ICP self-identify from the hero? if not, Customer Segments stays Yellow)
  and [`gtm/positioning-statement.md`](gtm/positioning-statement.md) +
  [`gtm/messaging-by-persona.md`](gtm/messaging-by-persona.md) — the hero copy is
  the copy standard for every sequence.
- **Tested by** [`ai-feedback/`](ai-feedback/) — once there's traffic,
  `signal-scan` over "what did you think Ockham did?" replies is the 5-second
  test at scale.
- When a marketing site is built (roadmap), this is the hero-copy source — one
  screen at a time, drafted in Claude Design first per root `CLAUDE.md` §10.

---

**Source:** Douwe Wester, *Ideal Customer Led GTM* — the 5-second test and the
"We help [customer] do [job] so they can [outcome]" format (Quick Check card).
Captured 2026-09-04.
