# Stages — the drafting loop

The [`prd-agent.md`](../prd-agent.md) works these in order. Each stage reads the
prior artifacts and writes exactly one file into
`product-os/ai-prd/prds/<slug>/stages/`. Context compounds — a later stage never
re-derives what an earlier one settled; if it must contradict an earlier stage,
it goes back and fixes that stage.

| # | File | One line |
|---|---|---|
| 01 | `01-idea-brief.md` | Restate the ask as a problem + hypothesis; set the risk tier |
| 02 | `02-requirements.md` | Users, JTBD, scope, constraints; pick 1 of 2–3 framings |
| 03 | `03-knowledge-gathering.md` | What already ships; adjacent systems; prior attempts |
| 04 | `04-market-competitor-research.md` | Competitor table + the opening for us |
| 05 | `05-voice-of-customer.md` | Named demand signal; "said vs did"; gap flags |
| 06 | `06-metrics-strategy.md` | North-star + metrics + failure criteria + events; **(AI-native) owns the full addendum A–H** — ML-necessity, grounding, prompts, guardrails, evals, HHH, autonomy, model selection |
| 07 | `07-evidence-gathering.md` | Quantitative proof, each figure tagged; Evidence Appendix rows |
| 08 | `08-visual-strategy.md` | Surfaces, screens, states, IA (Claude Design) |
| 09 | `09-prototype-summary.md` | What was prototyped, status, what it validated |
| 10 | `10-roi-business-case.md` | Cost, market size, revenue scenarios, measured vs gated impact |
| 11 | `11-draft-prd-and-review.md` | Assemble `prd.md`; run the reviewer; apply fixes |
| 12 | `12-final-checklist.md` | Go / no-go gate |

Each stage file below states: **Purpose · Inputs · Do · Produce · Gate.**
