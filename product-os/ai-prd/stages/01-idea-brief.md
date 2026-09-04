# Stage 01 — Idea Brief

**Purpose:** turn whatever the user gave you into a sharp problem statement and a
falsifiable hypothesis, and set the review tier so every later stage is
calibrated.

**Inputs:** the user's brief (line / paragraph / doc) — **or a Discovery Brief
from [`../../ai-discovery/`](../../ai-discovery/)** if the idea came through
discovery; `context-hub/` (positioning, vision, ICP, metric rules).

**If given a Discovery Brief:** the problem, hypothesis, opportunity score,
primary JTBD, affected personas, **the candidate-solutions table (Diverge →
Converge)**, and a suggested tier are already validated. **Steps 1–3 below become
"verify and adopt"** — don't re-derive. Copy the candidate-solutions table into
`01-idea-brief.md` so stage 02 has it. Build the evidence plan (step 5) from the
brief's "what the PRD must still prove" list, and carry any `[pre-build]` item
straight to §15 with a "before build" due.

**Do:**
1. Restate the ask in one sentence — the feature, the user, the outcome.
2. Write the **problem** (a specific user, a specific cost of the status quo) and
   the **hypothesis** ("if we build X, then <measurable> will move, because …").
3. Run 3–5 Socratic questions and answer them from context (mark answers you're
   assuming): *What specific pain does this solve? How do we know it's real? Who
   feels it most? What's the cost of not solving it? Why this, why now?*
4. Assign the **risk tier (1–4)** per `review-rubric.md`, one sentence of why.
   The reviewer confirms or overrides this at stage 11 — its tier is authoritative.
5. List what you'd need to prove the hypothesis and where each piece would come
   from — this is the work order for stages 03–07.

**Produce — `01-idea-brief.md`:**
- One-sentence restatement
- Problem / Hypothesis
- Socratic Q&A (assumptions flagged)
- Tier + rationale
- Candidate-solutions table (carried from the Discovery Brief, if any)
- Evidence plan (claim → intended source; `[pre-build]` items marked)

**Gate:** the hypothesis is falsifiable and the tier is set. If the brief has two
readings that change scope, stop and ask the user.
