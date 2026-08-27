# Agentic AI for SRE — Design Considerations

> Source note: adapted and generalized from public industry research on applying
> agentic AI to SRE/operations practice. Vendor-specific product and tool names
> have been abstracted to generic technical roles so these considerations stay
> portable across implementations.

## Purpose

This document captures the core design principles that must govern any agentic
AI system introduced into SRE/operations workflows. These are non-negotiable
constraints, not aspirational goals — they define the guardrails within which
every SRE agent (alerting, incident investigation, insights, reliability
design, etc.) must operate. See `intent-and-build-guide.md` for how these
principles translate into the actual system to build.

## Core Design Principles

1. **Non-Replacement of Working Automation**
   Don't replace already-successful automation (classic or AI-based) just
   because AI is available. Only introduce agentic AI where it adds provable
   value beyond what's already meeting business needs.

2. **Policy & Compliance Parity**
   Any AI-based system must comply with the same existing and upcoming
   policies, procedures, and regulatory obligations that govern current
   human/automated operations. No compliance exceptions because "it's an AI
   agent."

3. **Security, Safety & Privacy Parity**
   SRE AI agents must meet the same security, safety, and privacy bar as
   current systems and human operators — same data access controls, same
   audit requirements, same blast-radius limits.

4. **Strong Identity & Access Control**
   Every agent must have its own strong identity, with explicit roles and
   permissions assigned (least privilege) — never a shared or ambient
   credential. Every agent action must be attributable to that identity.

5. **Reliability SLOs & Backup/Fallback Paths**
   Agents themselves need defined reliability SLOs and a well-defined
   fallback (automated or manual) for when the agent is degraded, wrong, or
   unavailable. An agent must never become a single point of failure for the
   process it automates.

6. **Transparency & Explainability (No Black Boxes)**
   Agents must be able to explain and reason about why and how they took an
   action, and what alternatives were considered and rejected. Transparency
   is prioritized over opaque automation, even at some cost to autonomy.

7. **Business Continuity Contingencies**
   Business continuity / DR plans must explicitly include the failure mode
   "the AI system is wrong, unavailable, or compromised" — not just
   infrastructure failure.

8. **Continuous Access to Production Data**
   Agents need continuous, low-latency access to real production data
   (observability, topology, historical incidents). Decisions made on stale
   or synthetic data are considered unsafe.

9. **Continuous Evaluation & Auditability**
   Every agent must be continuously evaluated against a quality framework and
   support auditing/reporting so security tooling (detection & response) can
   monitor it like any other production actor.

## Success Criteria

An SRE agent is only justified if it does at least one of the following. If a
proposed agent doesn't map to any of these, it doesn't get built:

- Relieves engineers of laborious, repetitive operational work
- Improves the quality or speed of engineer decision-making and execution
- Improves prevention, detection, or mitigation beyond current capability
- Enables autonomous feedback loops that measurably improve service
  reliability
- Reduces overall operational cost

## Non-Negotiable Guardrail

Across every agent in the system, two things must always hold:

- Full transparency about what data an agent is evaluating and how
- Consistent controls that prevent unwanted mutations of production state —
  no agent silently writes to production without a controlled, auditable path

## Human-in-the-Loop Policy

Agentic automation does not mean removing humans from high-risk decisions.
For higher-risk services/features, a human stays in the loop — but the agent
still reduces the *time* a human spends, by pre-filtering and auto-resolving
lower-risk issues before they ever reach a person.

## Autonomy Levels

Because AI-based autonomous systems are powerful but not always
deterministic, every agent should be assigned a tracked autonomy level so its
actual scope of authority is explicit and auditable, not assumed. A practical
scale to adopt:

| Level | Behavior |
|---|---|
| L0 — Observe | Reads data, produces no output humans act on directly |
| L1 — Recommend | Surfaces findings/suggestions; human decides and executes |
| L2 — Act with approval | Prepares an action; a human must approve before execution |
| L3 — Act autonomously, within guardrails | Executes without approval inside a pre-defined, low-risk scope; logged and reviewable |
| L4 — Act autonomously, self-adjusting | Executes and adjusts its own scope based on outcomes; requires the highest evaluation/audit bar |

New agents should start at L0/L1 and only move up a level once evaluation
data justifies it — never assign L3/L4 by default.
