# PRD Template — Ockham

The canonical structure for every Ockham PRD. AI-native by default: the
addendum at the end is **required whenever the feature's core value depends on a
model**. Keep every section tight — a line that carries no information gets cut.
Every quantitative claim carries a citation ([`citations.md`](citations.md)).

---

```markdown
# PRD: <Feature name> <(mode / phase, if any)>

**Epic / ID:** <e.g. OCK-142-01>
**Owner:** <role — name TBD is fine>
**Area:** <which Ockham surface / module>
**Status:** Draft | In Review | Approved
**Date:** <YYYY-MM-DD>
**Target release:** <version or TBD>
**Tier:** <1–4> (see review-rubric.md)
**Related documents:**
- Stages: `stages/01 … 12`
- Prototype: `prototype/`
- <linked specs, roadmap lines, interview notes, prior PRDs>

---

## PRD Review — <launch-readiness rating>

**Launch-readiness:** Ready | Ready with Caveats | Not Ready
  (≡ Go | Go-with-conditions | No-go) — calibrated to Tier <1–4>
**Major blindspot:** <one line — the biggest unverified or wrong thing>
**Dimension scores:** Opportunity & Hypothesis · Product Scope · UX & Impact ·
Metric & Data Rigor · Adjacent Impact · Prior Learnings · AI Readiness —
each Looks Good / Needs Review
**Critical requirements (close before build / GA):**
1. … — owner — due
**Optimizations:**
- …

Applied improvements are cited inline as `[Source: PRD Review]`.

---

## 1. Overview

2–4 sentences: what we're building, for whom, why now, and the expected outcome
(quantified, cited). Someone should be able to read only this and repeat the bet.

## 2. Problem Statement

The problem in plain terms.

- **Who is affected:** primary / secondary; who is explicitly *not* affected.
- **How they solve it today:** the current workaround and what it costs.
- **Impact of the problem:** the numbers `[Data: …]` / `[Source: …]`.
- **Evidence honesty:** what the numbers actually prove vs. what they don't.

*(AI-native: include the **Why Agentic AI** table — unstructured data involved /
why rules fail / why an LLM is necessary / why not raw chat.)*

## 3. Goals, Non-Goals & Out of Scope

**Goals** — few, priority-ordered, measurable where possible; include guardrail
metrics (what must *not* regress).

**Non-Goals** — what we are deliberately not doing, each with a one-line why.

**Out of Scope (this iteration)** — deferred, with the trigger for revisiting.

## 4. Users, Personas & Use Cases

Per persona:
- **Persona:** who they are, product fluency.
- **Goals:** what they're trying to get done.
- **Pain points:** today.
- **Key use cases:** the 2–4 concrete flows.
- **Assumptions:** what must be true about them.

## 5. Solution & Approach

- **Shape of the solution** — enough that the team can see the same picture.
- **Alternatives considered** — and why rejected.
- **Principles** — the rules that guide design/build decisions.
- **Mini business case** — the ICP, the adoption goal, the **measured wedge**
  (what live data proves) vs the **assumed / gated impact** (what it doesn't —
  must not be narrated as proven). Recommendation.

## 6. Market & Customer Evidence

### 6.1 Voice of Customer
Named quotes / tickets / interviews. Separate what users **say** from what they
**do**. If feature-specific VoC is sparse, say so and make it a risk.

### 6.2 Market & Competitor Landscape
| Aspect | <Competitor A> | <Competitor B> | Opportunity for us |
|---|---|---|---|
| Feature | | | |
| Pricing / gating | | | |
| Key limitation | | | |
| User complaint / signal | | | |

Use the fixed competitor set from `context-hub/competitive-landscape.md`.

### 6.3 Quantitative Evidence
| Metric | Value | Citation |
|---|---|---|
| | | `[Data: … (run/date)]` |

## 7. User Stories / Features

Per story:

> **US-00X: <title>**
> As a <persona>, I want <capability>, so that <outcome>.
> **Priority:** P0 | P1 | P2 — **FR link:** FR-X — **Design:** `prototype/…`

**Acceptance criteria**
1. **Positive:** …
2. **Negative & error:** …
3. **Edge case:** zero/missing data, first-run, unauthorized, …
4. **Impact with other systems:** what it reads/writes; what it must never touch.

**NFR notes:** security, reliability.
**UX aspects:** usability, accessibility, responsiveness.

## 8. Requirements

### 8.1 Functional Requirements
`FR-1 … FR-N` — each traceable to a user story. One requirement per line.

### 8.2 Non-Functional & External Impact
- **Performance / scalability**
- **Security / privacy** — tenant isolation, PII, audit
- **Billing / entitlements**
- **Mobile**
- **APIs / integrations**
- **Fair usage / limits**

## 9. Experience & Prototype

- **9.1 Discovery & onboarding** — how users find it; first-run / empty state.
- **9.2 Feature usage** — primary path, secondary paths, error and zero states.
- **9.3 Lifecycle & controls** — enable/disable, data retention, permissions.
- **9.4 Cross-product experience** — where it lives; what it deep-links to; what
  it does not replace.
- **9.5 AI experience** — what the AI does and does not do; behaviour when the
  model / telemetry is unavailable (**show empty / error — never invent
  metrics**).
- **9.6 Visual strategy** — screen list and states (drafted in Claude Design).
- **9.7 Prototype** — status, path, what it validated (or "not run").

## 10. Data & Instrumentation

### 10.1 Metrics & Success Criteria
| Metric | Threshold / definition | Horizon | Source |
|---|---|---|---|
| North-star | | | |
| … | | | |

### 10.2 Events & Tracking
Event names, segments, dashboards. Note any "do not treat X as Y" traps.

## 11. Dependencies

- **External:** third parties, upstream data.
- **Internal:** services, design system, shared runtimes — each `[Spec: …]`.
- **Blockers:** named, each with an owner and status.

## 12. Pricing, Packaging & Entitlements

How it's sold (bundle vs SKU); entitlement = which access + which role
privileges; who owns final packaging. Capture unknowns in §15.

## 13. Rollout & Launch Plan

- **13.1 Phases** — Alpha → MVP GA (hard slice) → MVP GA (parity slice) → V2.
  State what each phase ships even if some data is still stubbed, with honest
  labelling.
- **13.2 Product & plan availability** — regions, environments, gaps.
- **13.3 GTM enablement** — launch type, messaging, channels. Note anything that
  must be reconciled *before* external claims.

## 14. Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|

## 15. Open Questions
| Question | Owner | Due / next step |
|---|---|---|

## 16. FAQs
| Question | Answer |
|---|---|

## 17. Evidence Appendix
| Claim | Citation | Source type |
|---|---|---|
| | | Spec / Data / VoC / Competitor / Roadmap / PRD Review |

---

## AI-native addendum (required when the feature's core value depends on a model)

### A. Per-component ML-necessity check
| Component | Is ML necessary? | Data available? | Meets accuracy bar? | Bias risk | Explainable? | Feedback loop speed |
|---|---|---|---|---|---|---|
| | PASS/PARTIAL/FAIL + note | | | | | |

### B. Grounding strategy
Single source of truth; what the model may and may not see; attribution on every
output; "not found" is a valid answer.

### C. Prompt strategy
| Task | Technique | Output format | Rationale |
|---|---|---|---|
Plus the prompt-improvement loop (versioning, eval cadence, correction-rate trigger).

### D. Hallucination guardrails
At inference / extraction; at chat; at the UI / human-in-the-loop.

### E. Evaluation strategy
Ground-truth sources; offline eval plan (metric / method / target / cadence);
online monitoring; failure criteria; the eval dataset location.

### F. Production readiness — HHH
| Pillar | Strength | Risk | Mitigation |
|---|---|---|---|
| Helpful | | | |
| Honest | | | |
| Harmless | | | |
Plus launch criteria per stage (Alpha / Beta / GA) and Responsible AI
(accountability, transparency, fairness, reliability & safety).

### G. Agent capabilities & autonomy
| Component | Input | Output | Autonomy level | Human-in-the-loop trigger |
|---|---|---|---|---|
Autonomy levels: *observe → suggest → act-with-approval → act*.
```
