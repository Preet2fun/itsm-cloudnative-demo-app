# Stage 04 — Solution Hypothesis (Diverge → Converge)

**Purpose:** turn the validated problem + ranked pain-points into a small set of
candidate solution shapes, and pick the one or two worth taking into a PRD.

**Inputs:** `01`–`03` — the ranked AI-solvable pain-points, the JTBD, the
current-state journey; [`../opportunity-scorecard.md`](../opportunity-scorecard.md)
(the AI-native verdict); `../context-hub/agentic-use-cases.md` (shapes that
already fit Ockham's model); `../knowledge-hub/` (feasibility sanity-check).

**Do:**

1. **Diverge** — generate **at least 5** distinct solution shapes for the top
   pain-point(s). Quantity over polish. Vary the *shape*, not the wording:
   - what it does — triage / investigate / recommend / act / summarise
   - autonomy level — observe → suggest → act-with-approval → act
   - surface — in-product panel, chat, digest, API, workflow hook
   - trigger — on alert, on schedule, on demand
   For each shape note: which pain it targets, and why it needs the model (or
   doesn't — a Bolt-on shape is a candidate to discard here).

2. **Converge** — score each shape 1–5 on two axes:
   - **Impact** — how much of the ranked pain it removes, for how many users
   - **Feasibility** — data availability, model fit, build/run cost, and
     adjacent-system disruption (check against `../knowledge-hub/`)

   Keep the **top 1–3** (high impact × workable feasibility). Kill the rest with
   a one-line reason.

3. **State the lead hypothesis** — for the top shape:
   *"If we build `<shape>`, then `<measurable>` moves for `<persona>`, because
   `<why the model makes this possible>`."*

**Produce — `04-solution-hypothesis.md`:**
- the divergence list (≥5 shapes, each tagged to a pain + an AI-native note)
- the convergence table (shape · impact · feasibility · keep/kill + reason)
- the lead hypothesis + 1–2 alternates

**Gate:** ≥5 shapes generated; top 1–3 chosen on impact × feasibility; the lead
hypothesis is falsifiable. These become the PRD's candidate framings
(`ai-prd/stages/02-requirements.md`).
