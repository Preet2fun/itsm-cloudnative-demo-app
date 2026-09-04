# Stage 06 — Decision & Brief

**Purpose:** commit — Pursue, Park, or Kill — and, on Pursue, produce the handoff
the PRD Agent starts from.

**Inputs:** `01`–`05`; [`../discovery-brief.md`](../discovery-brief.md).

**Decide:**

- **Pursue** — factors mostly 3+, AI-native check = **Native**, all fit gates
  pass, stage 04 produced a lead solution shape worth a PRD, and every "test
  before PRD" assumption has either passed a cheap test or is carried into the
  brief as an explicit `[pre-build]` item (below). A "test before PRD" item is
  **never** silently downgraded to "test during PRD".
- **Park** — a real opportunity, but a fit gate or a blocking assumption can't be
  resolved now. Record the **revisit trigger**.
- **Kill** — AI-native check = **Bolt-on** with no path to Native; or no evidence
  the problem is real; or a disqualifier (out of ICP / off positioning); or the
  score is clearly below bar. A confident Kill is a good outcome.

**Do:**
- **Pursue** → write `discovery-brief.md` to the template. It is the PRD Agent's
  stage-01 input — complete enough that the PRD starts with no back-questions.
- **Park / Kill** → write `decision-log.md` (reason · evidence · revisit trigger
  · strategy note).
- Either way: if the underlying signal keeps recurring across ideas, flag it for
  `../ai-product-strategy/`.

**Produce:** `06-decision-and-brief.md` (the decision + one-paragraph rationale)
and either `discovery-brief.md` (carrying the stage-04 candidate solutions, and
every un-run "test before PRD" assumption as a `[pre-build]` line in "What the
PRD must still prove") or `decision-log.md`.

**Gate:** the decision is explicit with a rationale. Pursue means the Discovery
Brief is complete and the PRD Agent can run from it directly.
