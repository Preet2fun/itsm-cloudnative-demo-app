# Positioning Statement — Finalized

The canonical statement for decks, the website, analyst briefings, and sequence
copy. The **draft, the wedge, the reasoning, and the proof chains** live in
[`../context-hub/positioning.md`](../context-hub/positioning.md) — this is the
distilled output.

---

## The statement

> **For** midsize IT teams that own both uptime and security with no dedicated
> SOC, **Ockham** is a **unified observability and security operations platform**
> whose agents investigate an incident across telemetry, security signals, and
> change history and return a **ranked, evidence-linked hypothesis of the
> cause — and whether it was an attack**. **Unlike** Datadog and Dynatrace,
> which reach the same answer only with a separate security product, a separate
> budget, and a separate team.

**The mechanism:** one eBPF sensor at the kernel feeds both the monitoring side
and the runtime-security side. A vendor running only one side can't replicate it.

---

## Components

| Component | Ockham |
|---|---|
| **Market category** | Unified observability and security operations platform |
| **Target customer** | 100–1,000 employees, IT org 20–80, no SOC, AWS + Kubernetes, one team owns both |
| **Primary alternative** | Two toolchains (an APM + an AWS-native or point security stack), two budgets, two rotations |
| **Key benefit** | One team reaches a checkable hypothesis of the cause on one budget — no tool-switching, no second team, no handoff |
| **Proof** | Shared eBPF sensor · linked-evidence timeline ("you can check its work") · time-to-first-hypothesis measurable in a POC |
| **Vision line** | Autonomous IT and security operations *(board / analyst / hiring — not the hero)* |

---

## Canonical short forms

Source of truth: [`../messaging.md`](../messaging.md). Repeated here so GTM has
the set in one place.

- **Hero headline:** "Your IT team runs uptime and security. Ockham runs the
  investigation — across both."
- **One-liner:** "Ockham is an AI-native observability and security operations
  platform for companies without a SOC. When an incident opens, its agents
  investigate across telemetry, security signals, and change history, then tell
  you what caused it — and whether it was an attack — with the evidence to check."
- **Elevator (two sentences):** "Midsize IT teams increasingly own both uptime
  and security with no separate SOC, and pay for a monitoring stack and a
  security stack that don't talk to each other. Ockham is one platform, run by
  one team on one budget: the same eBPF sensor feeds both sides, and agentic
  investigation returns a ranked, evidence-linked hypothesis instead of two
  consoles full of alerts."

---

## Guardrails (from `context-hub/positioning.md` § Metric rules)

- Frame time as **time-to-first-hypothesis**, not time-to-resolution. **Never
  "in seconds."**
- A ranked, evidence-backed hypothesis is still useful when it's second-best.
  Don't claim "the exact root cause" — that's a bet you lose half the time.
- "AI-powered" in ad copy; **"AI-native"** in the build story.
- Competitor references: the fixed 7 only
  ([`../context-hub/competitive-landscape.md`](../context-hub/competitive-landscape.md)).
