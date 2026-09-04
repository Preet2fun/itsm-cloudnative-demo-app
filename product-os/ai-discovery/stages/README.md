# Stages — the discovery loop

[`discovery-agent.md`](../discovery-agent.md) works these in order. Each reads
the prior artifacts and writes one file into
`product-os/ai-discovery/discovery/<slug>/stages/`. The loop is short on purpose
— its job is to reach a **Pursue / Park / Kill** call cheaply, before a PRD is
spent.

| # | File | One line |
|---|---|---|
| 01 | `01-idea-intake.md` | Restate the idea as a problem; type it; provenance; fast fit check |
| 02 | `02-opportunity-scoring.md` | Score the five factors + AI-native check + Ockham fit → a lean |
| 03 | `03-problem-space-research.md` | Synthesize signals; JTBD; current-state journey; evidence gaps |
| 04 | `04-solution-hypothesis.md` | Diverge ≥5 solution shapes → converge to top 1–3 by impact × feasibility → lead hypothesis |
| 05 | `05-assumption-and-risk-map.md` | Rate the assumptions; split test-before / test-during / accept |
| 06 | `06-decision-and-brief.md` | Pursue / Park / Kill; write the Discovery Brief or the decision log |

Each file: **Purpose · Inputs · Do · Produce · Gate.** An early stage can end the
loop — a failed fit gate (01), a Bolt-on verdict (02), or no problem evidence
(03) routes straight to a stage-06 Kill.
