# Stage 11 — Draft PRD & Review

**Purpose:** assemble the full PRD from the stage artifacts, run it through the
reviewer, and fold the fixes back in.

**Inputs:** `01`–`10`; [`../prd-template.md`](../prd-template.md);
[`../prd-reviewer-agent.md`](../prd-reviewer-agent.md); [`../citations.md`](../citations.md).

**Do:**
1. **Assemble `prd.md`** to `prd-template.md` exactly — header block, an empty
   PRD Review block, sections 1–17, and the AI-native addendum if the feature's
   core value depends on a model.

   | Section | Source |
   |---|---|
   | §1 Overview | 01 (the bet) + 10 (outcome / recommendation) — *synthesised* |
   | §2 Problem | 01, 05, 07 |
   | §3 Goals / Non-goals / OOS | 02 |
   | §4 Users, Personas & Use Cases | 02 + Discovery Brief personas |
   | §5 Solution & Approach | 02 (framings), 10 (mini business case) |
   | §6 Market & Customer Evidence | 04, 05, 07 |
   | §7 User Stories | 02 (stories), 08 (acceptance-criteria states), 03 (cross-system impact) |
   | §8 Requirements | 02 (FR skeleton), 03 (NFR / constraints), 06 (metrics-driven NFRs) |
   | §9 Experience & Prototype | 08, 09 |
   | §10 Data & Instrumentation | 06, 07 |
   | §11 Dependencies | 03 |
   | §12 Pricing, Packaging & Entitlements | 10; thin at draft stage — unknowns → §15, name the packaging owner |
   | §13 Rollout & Launch Plan | 02 (phasing intent), 06 (launch criteria per stage), 10 (proceed / phased) |
   | §14 Risks | every stage's flagged risks + every Gated figure |
   | §15 Open Questions | every stage's open questions + every `[pre-build]` item (owner + "before build" due) |
   | §16 FAQs | *synthesised at assembly* — the reader's likely questions; no source stage |
   | §17 Evidence Appendix | 07 |
   | AI addendum A–G | 06 (07 verifies its data claims) |

   - Carry every Gated figure into §14/§15. Cite every number.
2. **Run the reviewer** — invoke `prd-reviewer-agent.md` against `prd.md`. It
   returns the scorecard: launch-readiness rating (Ready / Ready with Caveats /
   Not Ready), tier, major blindspot, dimension-by-dimension scores, detailed
   findings & fixes (write-ready text + evidence), and prioritised action items
   (Critical requirements vs Optimizations).
3. **Apply fixes** — fold accepted action items into `prd.md`; cite each changed
   or added passage inline as `[Source: PRD Review]`. Fill the PRD Review block
   with the launch-readiness rating, major blindspot, dimension scores, and the
   Critical requirements list.
4. **Re-check** — reviewer re-checks changed sections only and finalises the
   rating. If **Not Ready** and the fix needs a decision you can't make from
   context (pricing, a policy owner, a strategy call), stop and ask the user.

**Produce:** `prd.md` (assembled + reviewed) and `11-draft-prd-and-review.md`
(the scorecard + what was applied / deferred).

**Gate:** launch-readiness is **Ready** or **Ready with Caveats**, with every
Critical requirement logged in §14/§15 with an owner and a due.
