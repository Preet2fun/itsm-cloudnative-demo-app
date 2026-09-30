# Failure Triage Log

When Ockham's AI agent gets something wrong in production — a bad RCA, a
missed detection, a hallucinated citation — this is where it's caught,
classified, logged, and routed to a fix.

---

## Severity classes

| Class | Definition | Routes to |
|---|---|---|
| **Cosmetic** | Wrong tone, formatting, or verbosity — no wrong fact, no wrong recommendation | Logged only; batched into the next prompt-iteration pass |
| **Wrong, but caught** | The agent's own confidence framing flagged it as uncertain (per the "ranked hypotheses, not a single guess" design stance), and a human caught it before acting on it | Logged; becomes a candidate offline-eval fixture — see below |
| **Wrong and confident** (silent failure) | The agent stated an incorrect RCA, root cause, or citation as fact, with no hedge | Highest severity — immediate triage; always escalates per [`agent-reliability-monitoring.md`](agent-reliability-monitoring.md)'s "no silent drift" rule |
| **Missed detection** | The agent should have flagged something and didn't | Treated as **wrong and confident** — a silent false negative carries the same trust cost as a wrong positive |

---

## Entry template

| Field | What goes here |
|---|---|
| Date | when caught, not when it happened, if different |
| Environment / account | which tenant or demo environment surfaced it |
| What happened | plain description — the agent's actual output vs. what was correct |
| Severity class | one of the four above |
| Root cause | label **HYPOTHESIS:** if not yet confirmed — same discipline as `ai-feedback/` |
| Caught by | Langfuse automated scorer · human review · customer report |
| Fix status | open · added as eval fixture · shipped |
| Routed to | `failure-triage-log.md` entry only · new `ai-engine/` offline-eval fixture · `incident-runbook.md` (if it caused or contributed to a live incident) |

---

## Log

> **Row below is a dummy, illustrative entry — no real production failure
> behind it.** It exists so the triage flow has something concrete to read
> before a real agent is in production. Replace with real rows as soon as an
> actual failure is triaged; delete the dummy row at that point rather than
> leaving it to be mistaken for data.

| Date | Environment | What happened | Severity | Root cause | Caught by | Fix status | Routed to |
|---|---|---|---|---|---|---|---|
| 2026-09-18 *(SAMPLE)* | demo environment (AI-drafted resolution notes) | The agent's drafted resolution note cited a trace ID that belonged to an adjacent, unrelated incident — the root cause narrative was fluent and specific, but wrong | Wrong and confident | **HYPOTHESIS:** the retrieval step pulled the highest-similarity trace by service name alone, without checking the trace's own timestamp fell inside the incident window | Human review (support-eng spot-check, not caught by an automated scorer) | Added as eval fixture | New `ai-engine/` offline-eval fixture — timestamp-window check added to the trajectory-scoring rubric |
| | | | | | | | |

---

## Upstream

[`agent-reliability-monitoring.md`](agent-reliability-monitoring.md) (what
surfaces a candidate), [`feedback-routing.md`](feedback-routing.md) (when a
customer report is the source instead of internal monitoring).

## Downstream

`ai-engine/design/synthetic-rca-eval-design-considerations.md` (where a
confirmed severe failure becomes a permanent regression-test fixture — a
product-to-engineering handoff, not something this log edits directly);
[`incident-runbook.md`](incident-runbook.md) (when a failure is severe enough
to be a live incident, not just a triaged bug).

## Status

Framework + one illustrative sample entry. No real triage history yet
(pre-launch).
