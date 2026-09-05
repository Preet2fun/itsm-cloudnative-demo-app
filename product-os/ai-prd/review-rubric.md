# PRD Review Rubric

Used by [`prd-reviewer-agent.md`](prd-reviewer-agent.md). Structure follows
**Uber's AI PRD Evaluator** (six review dimensions + a tiered launch-readiness
scorecard). Dimension 7 is Ockham's AI-native extension. Tier sets depth;
dimensions set what's checked; gates set the rating.

---

## Tiers

| Tier | The change is… | Scored dimensions |
|---|---|---|
| **1** | UX parity / discoverability / copy — small, reversible | 1, 2, 4 |
| **2** | Incremental workflow change or internal-tooling migration | 1–6 (+7 if AI-native), concise |
| **3** | Net-new capability, new AI capability, or new data dependency | all; **3–6 (+7) must be Looks Good**; eval plan + adjacent-systems map + AI addendum required |
| **4** | Policy / pricing / packaging / marketplace-sensitive; hard to reverse | Tier 3 + a **named sign-off owner per §14 risk**; guardrail review mandatory |

Assign the highest tier that applies, with one sentence of why. **The reviewer's
tier is authoritative** — if it differs from the stage-01 / Discovery-Brief tier,
the drafter updates the PRD header.

---

## The seven dimensions

Rate each **Looks Good / Needs Review** (+ **Blocking** when a gate trips). A
finding must quote the PRD line or name the missing thing.

### 1. Opportunity & Hypothesis
*Is the problem real, and is success defined clearly enough to evaluate?*
- Problem is concrete — a specific user, a specific cost. Not "users want better X".
- Hypothesis is falsifiable: "if X, then <measurable> moves, because …".
- Ladders to a positioning / vision line in `context-hub/`; "why now" answered;
  opportunity cost named.
- Every number tagged **Measured / Assumed / Gated** (`citations.md`).
  **A Gated figure written as proven → Blocking.**
- VoC present, or its absence explicitly flagged as a risk.

### 2. Product Scope
*Is the proposal understandable, well-scoped, and decision-ready?*
- Overview passes "read this alone and repeat the bet".
- Goals: few, measurable, with guardrail metrics.
- Non-goals and out-of-scope explicit, each with a why / trigger.
- MVP is the smallest thing that tests the core hypothesis.
- No unresolved fork that changes scope — that's a stop-and-ask, not a PRD.

### 3. User Experience & Impact
*Does the experience hold up across user segments, regions, and edge cases?*
- Personas / segments covered; where needs differ by segment is stated.
- Regional / geo and localization / compliance differences considered (or
  explicitly N/A).
- Every screen has its non-happy states: empty / zero-data, first-run, error,
  unauthorized.
- Acceptance criteria cover negative, edge, and cross-system cases.
- AI unavailable → show empty / error, never invented metrics.

### 4. Metric & Data Rigor
*Success metrics, guardrails, and a credible validation approach defined?*
- North-star is an outcome, not a vanity count; honours `context-hub/` metric
  rules (time-to-first-hypothesis framing; never "in seconds").
- Guardrail metrics present.
- Credible validation: offline **and** online eval plan (metric / target /
  cadence); failure criteria stated.
- AI-specific metrics where relevant: accuracy, hallucination / groundedness
  rate, calibration, cost per run, correction rate.
- **Tier 3–4 with no failure criteria or no eval plan → Blocking.**

### 5. Adjacent Impact
*Effect on adjacent systems, hidden dependencies, and partner concerns.*
- Names the shipped features / services it reads from, writes to, or sits beside
  (cross-check `knowledge-hub/`).
- States what breaks if it changes, and the blast radius.
- Second-order effects surfaced: load, cost, on-call surface, incentives, RBAC,
  tenant isolation.
- Partner / cross-functional concerns named (platform, security, pricing,
  support, GTM).
- **Policy / pricing / marketplace change with no named guardrail owner → Blocking.**

### 6. Prior Learnings
*Related experiments, hypotheses, and scattered context — surfaced and reconciled.*
- Related prior PRDs / experiments / hypotheses identified.
- The PRD doesn't repeat a past failed approach without saying why it's different.
- Contradictions with an existing learning, roadmap line, or dashboard are
  reconciled, not ignored.
- If it came from a Discovery Brief: its opportunity score, hypothesis, and
  assumption & risk map are carried, not silently dropped or contradicted; every
  `[pre-build]` item is in §15 with an owner. **An open `[pre-build]` item with
  no owner or no close-before-build plan → Blocking.**

### 7. AI Readiness  *(Ockham extension — when core value depends on a model)*
- Passes the per-component ML-necessity check (template addendum A).
  **ML not required but claimed → Blocking.**
- Not an existing workflow with a model bolted on the side.
- Grounding strategy: what the model may / may not see; attribution on every
  output; "not found" is a valid answer.
- Hallucination guardrails at inference, at chat, at the UI.
- Per capability: autonomy level (*observe → suggest → act-with-approval → act*)
  + human-in-the-loop trigger.
- HHH covered; disclaimers where the output could be acted on.
- Probabilistic behaviour acknowledged — a ranked, evidence-backed output, not a
  single guess presented as fact.
- Model requirements & selection trade-offs stated (addendum H) — model /
  provider, context window, temperature, cost per call, and why it beats the
  next-best alternative on accuracy / cost / latency.

---

## Launch-readiness scorecard

| Rating | Meaning |
|---|---|
| **Ready** | Every in-scope dimension **Looks Good** at this tier. |
| **Ready with Caveats** | Sound bet; the **Critical requirements** list must close before build / before GA (each: what · owner · due). |
| **Not Ready** | Any Blocking gate tripped (incl. an open `[pre-build]` item with no owner), or a Tier 3–4 core dimension (3–6, +7 if AI-native) at Needs Review. Re-draft the named sections. |

(≡ PRD Genie verdict: Ready = Go, Ready with Caveats = Go-with-conditions,
Not Ready = No-go.)

Calibrated to tier: a Tier 1 PRD needs only dimensions 1, 2, 4 clean to be
**Ready**; a Tier 4 PRD needs all seven plus a named sign-off owner per §14 risk.

---

## Scorecard output

Four parts (see `prd-reviewer-agent.md` §4):
1. **Dimension-by-dimension** — Looks Good / Needs Review per dimension.
2. **Detailed findings & fixes** — per gap: what's missing · write-ready
   replacement text · evidence from a linked doc or prior experiment.
3. **Prioritised action items** — **Critical requirements** vs **Optimizations**,
   with a "start here" pointer to the single most important fix.
4. **Major blindspot** — one line: the biggest unverified or wrong thing.
