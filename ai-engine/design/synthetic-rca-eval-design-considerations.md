# Synthetic RCA Evaluation — Design Considerations

> Source: studied directly from the open-source SRE agent project
> `Tracer-Cloud/opensre`'s `tests/synthetic/` suite (read via git clone, not
> copy-pasted) — used here as a reference architecture for a scored,
> adversarial synthetic RCA benchmark. Tooling/vendor names below are
> re-mapped to our own stack (kubeadm K8s + Prometheus + Loki + Jaeger +
> Grafana + external PostgreSQL), not the source repo's AWS/Datadog specifics.

## Core Idea

A synthetic RCA suite is a set of self-contained "scenario" fixtures — a
frozen snapshot of telemetry (metrics/logs/traces/events) plus a
machine-checkable answer key — run through the real investigation agent
pipeline (plan → investigate → diagnose) against a mocked telemetry backend.
Pass/fail is computed by pure, deterministic scoring functions, never by
vibes or a second LLM "judge" call.

## Design Principles

1. **Score correctness, not just presence of an answer.** A scenario passes
   only when ALL hold: predicted root-cause category matches the answer key
   (or an explicitly listed equivalent category); every required keyword
   appears in the output; the category is not in a forbidden set; no
   forbidden keyword appears; every required evidence source was actually
   consulted.

2. **"Required evidence" must be proven, not claimed.** A scenario can
   require specific evidence sources (Prometheus metrics, K8s events, trace
   spans, …) to be populated in the agent's own evidence state — not merely
   referenced in its output text. This stops an agent from pattern-matching
   the alert title into a plausible answer without investigating. Evidence
   predicates must distinguish semantically distinct sources even when they
   share one transport channel (e.g. don't conflate a raw metric time-series
   with a trace-derived load-attribution breakdown just because both flow
   through one generic "metrics" bucket).

3. **Adversarial elements are first-class scenario metadata, not
   incidental.** Every scenario declares its `adversarial_signals`
   (deliberate confounders) and, at harder tiers, `forbidden_categories` /
   `forbidden_keywords` the agent must NOT land on. Red herrings are a design
   input, not a side effect of noisy data.

4. **Difficulty is a curriculum, not a binary.** Four levels:
   - **L1** — single dominant signal, one-step identification
   - **L2** — one confounder present; a second evidence source is needed to rule it out
   - **L3** — absent or indirect evidence — key signal missing or misleading, needs timeline reasoning
   - **L4** — compositional fault — two failure modes active at once; agent must separate the root cause from a causally-linked side effect

5. **Keyword matching must be semantic, layered, and auditable.** Pure
   exact-string matching is too brittle (any rewording fails a correct
   answer); pure fuzzy matching invites false passes. Layer: exact-phrase →
   alias table for known synonyms → token-subset fallback. Track exact vs.
   semantic matches separately so over-reliance on fuzzy matching is itself
   observable in the report.

6. **Split efficiency from adversarial reasoning — track the gap.** Two axes:
   - **Axis 1 (efficiency):** the agent is handed the full fixture regardless of query; scores whether it reaches the right answer efficiently (right actions, bounded loops, no waste).
   - **Axis 2 (reasoning):** evidence is gated — a selective backend returns only what the agent explicitly queried for, and the agent must explicitly rule out alternative hypotheses in its output (`ruling_out_keywords`).
   The **Axis 1 → Axis 2 pass-rate gap is the primary adversarial-robustness
   health metric.** A large gap means the agent can answer when handed
   everything but can't reason about what to look at.

7. **Trajectory is scored, not just the final answer.** Record the agent's
   actual executed action sequence and score it on three independent axes:
   sequencing (right action types present — set membership, since parallel
   order is non-deterministic), calibration (stayed within a max
   investigation-loop budget), and budget (no unnecessary extra actions).
   Support multiple matching strictness modes (strict-order /
   longest-common-subsequence / set-membership) — not every scenario needs
   the same rigor.

8. **MECE fixture design — uniqueness on the full fingerprint, not just the
   failure mode.** Two scenarios can share a root-cause category but must be
   distinguishable by a distinct combination of (primary signal × rate of
   change × corroborating-evidence presence × event-stream presence). e.g.
   "resource exhaustion with the metric present" and "same failure with that
   metric missing, inferred from side evidence" are different scenarios, not
   duplicates.

9. **Determinism is a contract, enforced in CI.** Commit each scenario's pure
   scoring output computed against an empty/no-op agent state as a baseline
   artifact. Any change to the scoring/report schema must update the
   baseline in the same PR — this catches silent schema drift and keeps
   scoring reproducible across runs and model versions.

10. **Tier scenarios into CI cadence by cost and difficulty.** Cheap,
    low-difficulty scenarios run on every commit. Expensive or high-difficulty
    (indirect inference, adversarial Axis 2) scenarios run nightly — fast
    feedback stays fast without dropping deep coverage.

11. **Everything is schema-validated, not just structurally present.**
    Controlled vocabularies (valid failure modes, valid evidence-source IDs,
    valid trajectory action names) are enforced at fixture-load time with
    descriptive errors — a typo'd evidence source or unknown action name
    fails loudly, not silently.

12. **Scoring code has zero runtime/LLM dependencies.** Scoring, evidence
    predicates, and trajectory-policy evaluation are pure functions over
    plain data (dicts/dataclasses) — no agent-runtime imports, no I/O, no LLM
    calls. This keeps the hardest-to-get-right part of the system (the
    grading logic) unit-testable in isolation and fast to run.

## What Counts as "Root Cause Accuracy" Here

Not a single fuzzy score — a composite gate list that must **all** pass:
category match, keyword match, forbidden-category clear, forbidden-keyword
clear, required-evidence-sources populated, trajectory-budget respected. A
scenario is pass/fail on the AND of these gates, with each gate's status
individually reported for debugging.

## Ties to the Broader Agentic-AI Design Considerations

See `design-considerations.md` in this folder — transparency/explainability,
continuous access to real production-shaped data (here: realistic telemetry
fixtures), and auditability apply directly: every scored run must be able to
show *why* it passed or failed, gate by gate, not just a pass/fail bit.
