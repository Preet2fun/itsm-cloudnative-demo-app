# Stage 02 — Requirements

**Purpose:** define who it's for, what job it does, where the boundary is, and
which strategic framing we're committing to.

**Inputs:** `01-idea-brief.md` (incl. any carried candidate-solutions table); the
`discovery-brief.md` if this came from `../../ai-discovery/`;
`context-hub/icp.md`, `context-hub/positioning.md`; `ai-product-strategy/`.

**Do:**
1. **Users & JTBD** — primary and secondary personas; the job each is hiring this
   feature to do; who is explicitly not a user.
2. **Scope**
   - **Goals** — few, priority-ordered, measurable where possible; guardrail
     metrics (what must not regress).
   - **Non-goals** — deliberate exclusions, each with a why.
   - **Out of scope (this iteration)** — deferred, with the revisit trigger.
3. **Constraints** — performance, cost, security/tenant-isolation, compliance,
   platform, timeline. Pull hard numbers from `knowledge-hub/` where they exist.
4. **Framings** — write 2–3 genuinely different strategic approaches (e.g.
   surface-first vs workflow-first vs evidence-first). One paragraph each: the
   bet, what it optimises, what it gives up. **Pick one**, with rationale.
   *If a Discovery Brief is the input, its candidate solutions (the stage-04
   Diverge → Converge shapes) are your starting framings — extend or re-score
   them here rather than starting from scratch.*
5. **User stories & FR skeleton** — from the chosen framing + the JTBD, write the
   `US-xxx` stories (As a / I want / So that + P0/P1/P2) and derive one `FR-x`
   line per acceptance path. Acceptance criteria (negative / edge / cross-system)
   are filled at stage 08 once surfaces and states exist, and finalised at
   stage 11.

**Produce — `02-requirements.md`:** Users & JTBD · Goals / Non-goals / Out of
scope · Constraints · Framings (2–3) + chosen framing + why · US-xxx stories +
FR-x skeleton.

**Gate:** scope boundary is explicit, one framing is chosen, and every user story
has a priority. Everything downstream builds the chosen framing only.
