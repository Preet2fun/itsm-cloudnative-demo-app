# Discovery Brief — template

The handoff artifact. Written at stage 06 when the decision is **Pursue**. It is
the [`../ai-prd/`](../ai-prd/) PRD Agent's **stage-01 input** — a validated
problem plus candidate solutions, so the PRD starts from evidence instead of a
one-line idea.

```markdown
# Discovery Brief: <idea name>

**Date:** <YYYY-MM-DD>   ·   **Decision:** Pursue
**Provenance:** <where the idea came from — a signal, a request, a competitor move, a strategy prompt>

## Problem
<the problem in plain terms — a specific user, a specific cost of the status quo.
Not the feature.>

## Hypothesis
If we <do X>, then <measurable> will move, because <why>.

## Opportunity score
<the five-factor result + lean · the AI-native check verdict (Native / Bolt-on) ·
the Ockham-fit result>. One line on **why now**.

## Who has it
- **Primary persona:** <from context-hub/icp.md> — why they feel it most.
- **Secondary:** <…>
- **Not affected:** <…>

## Primary job-to-be-done
When <situation>, I want to <motivation>, so I can <outcome>.

## Candidate solutions (Diverge → Converge)
The top 1–3 solution shapes from stage 04. The lead shape is the hypothesis
above; the alternates are the PRD's fallback framings (`ai-prd/stages/02`).

| Shape | Impact (1–5) | Feasibility (1–5) | Note |
|---|---|---|---|
| **<lead>** | | | |
| <alt 1> | | | |

## What we know vs what we're assuming
| Verified | Source |
|---|---|
| … | `[Data: …]` / `[Source: …]` |

| Still assuming (open) | Confidence | Impact if wrong |
|---|---|---|
| … | low / med / high | low / med / high |

## What the PRD must still prove
<the "test during PRD" assumptions from stage 05 — these become the PRD's
evidence-stage work>

**`[pre-build]`** — any stage-05 "test before PRD" assumption that was **not**
actually run in discovery. It stays a blocker: the PRD must resolve it before
build starts (not merely before GA), and the PRD reviewer treats an open
`[pre-build]` item as Blocking.
- `[pre-build]` <assumption> — cheapest test — owner

## Suggested PRD tier
<1–4> — <one line>   (a first guess for the PRD reviewer to confirm)

## Recommendation
Pursue — <2–3 sentences: the bet, the wedge, why now>.
```

---

## Park / Kill — use `decision-log.md` instead

```markdown
# Discovery Decision: <idea name>

**Date:** <YYYY-MM-DD>   ·   **Decision:** Park | Kill
**Reason:** <the specific gate or factor that failed>
**Evidence:** <what was looked at>
**Revisit trigger:** <Park only — the condition that would reopen this>
**Strategy note:** <if this signal keeps recurring, what ai-product-strategy should know>
```
