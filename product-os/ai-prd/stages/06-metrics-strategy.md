# Stage 06 — Metrics & AI Design Strategy

**Purpose:** define how we'll know it worked and what would make it a failure —
and, for AI features, the design decisions that make the AI trustworthy
(grounding, prompts, guardrails, evals, autonomy). This stage **owns the
template's AI-native addendum (A–G)**.

**Inputs:** `01`–`03`; `context-hub/` metric rules; `../../ai-pmf-strategy.md`
(dual metrics).

**Do — metrics (always):**
1. **North-star** — one outcome metric, not a vanity count. Honour the metric
   rules: frame time-based value as **time-to-first-hypothesis**, not
   time-to-resolution; **never "in seconds"** — state what it produces.
2. **Primary & secondary metrics** — table: metric · baseline · target · how
   tracked · horizon.
3. **Guardrail metrics** — what must not regress.
4. **Failure criteria** — the explicit conditions under which this feature is a
   failure and gets pulled or reworked.
5. **Events & tracking** — event names, segments, dashboards; call out any
   "don't treat X as Y" trap.

**Do — AI design (AI-native features only):**
6. **ML-necessity check** (addendum A) — per component: Is ML necessary? Data
   available? Meets the accuracy bar? Bias? Applicable law? Explainable? Feedback
   loop speed? → PASS / PARTIAL / FAIL + note. **A FAIL on "Is ML necessary?"
   means the feature should not be built as an AI feature — stop and flag it.**
7. **AI-specific metrics** (adds to steps 2–4) — accuracy (F1 or task metric),
   hallucination / groundedness rate, calibration, latency, cost per run,
   correction rate.
8. **Grounding strategy** (addendum B) — the single source of truth; what the
   model may and may not see; attribution required on every output; "not found"
   is a valid answer.
9. **Prompt strategy** (addendum C) — per task: technique · output format ·
   rationale; plus the prompt-improvement loop (versioning, eval cadence,
   correction-rate trigger).
10. **Hallucination guardrails** (addendum D) — at inference / extraction, at
    chat, at the UI / human-in-the-loop.
11. **Evaluation strategy** (addendum E) — ground-truth sources; offline eval
    plan (metric · method · target · cadence); online monitoring; the eval
    dataset location. Stage 07 verifies any data claims this makes.
12. **Production readiness — HHH** (addendum F) — Helpful / Honest / Harmless:
    strength · risk · mitigation; launch criteria per stage (Alpha / Beta / GA);
    Responsible AI (accountability, transparency, fairness, reliability & safety).
13. **Agent capabilities & autonomy** (addendum G) — table: component · input ·
    output · autonomy level (*observe → suggest → act-with-approval → act*) ·
    human-in-the-loop trigger.
14. **Model requirements & selection trade-offs** (addendum H) — per capability:
    model / provider, context window, temperature, max output tokens, latency
    target, cost per call. State why this model beats the next-best alternative
    (accuracy / cost / latency) and the fallback if pricing or availability
    changes.

**Produce — `06-metrics-strategy.md`:** North-star · Metrics tables · Guardrails ·
Failure criteria · Events. (AI-native) the full addendum A–H.

**Gate:** north-star is an outcome; failure criteria exist. For AI features: the
ML-necessity check is done and addendum A–H is drafted.
