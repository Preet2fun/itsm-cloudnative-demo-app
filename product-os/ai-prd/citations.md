# Citations & Evidence Honesty

Every quantitative or externally-sourced claim in a PRD carries a tag. This is
what makes the output checkable — the reader can follow any claim back to where
it came from.

---

## Tags

| Tag | Use for | Example |
|---|---|---|
| `[Data: <source> (<run/date>)]` | A number from a live / measured source — a warehouse query, analytics, logs, tickets | `[Data: analytics weekly-active (2026-09-01)]` |
| `[Feedback: <source> (<query/window> · <N> accounts · <date>)]` | A customer-feedback figure from an `ai-feedback/` lens (MCP tool or CSV) | `[Feedback: Zendesk (bulk-export · 34 accounts · 2026-09-01)]` |
| `[Spec: <doc>]` | A claim from an internal spec, design, or context doc | `[Spec: context-hub/positioning.md]` |
| `[Source: <name>]` | A named external source — competitor doc, analyst report, roadmap line, interview | `[Source: Gartner AI SRE Market Guide, Jan 2026]` |
| `[Evidence: <artifact>]` | A figure produced/verified in stage 07 | `[Evidence: 07-evidence-gathering.md #tam]` |
| `[Source: PRD Review]` | Text added or changed because the reviewer flagged it | inline, at the changed sentence |

An uncited quantitative claim does not ship. If you can't source it, it becomes
an assumption (below) or an open question.

---

## Evidence honesty — every number is one of three

| Label | Meaning | How to write it |
|---|---|---|
| **Measured** | Verified against a live source this run | State plainly, with `[Data: …]` / `[Evidence: …]` |
| **Assumed** | An estimate, an unverifiable secondary source, or an `ai-feedback/` output tagged **HYPOTHESIS** | Prefix "Assumed:" and say what it's based on |
| **Gated** | Depends on a source not yet confirmed (a table that may not exist, a host not verified, a roadmap not reconciled) | State the dependency; **never write it as proven**; add a §14 risk or §15 open question |

The failure mode this prevents: a scale number that proves one thing (e.g. total
request volume) being narrated as proof of a different thing (e.g. adoption of
the new feature). Name what each number proves **and what it does not**.

---

## "Not found" is a valid, required result

Sparse VoC, a missing dataset, an unconfirmed integration — write it down as
fact. "No named customer has asked for this by name; validate in beta" is a
legitimate line in a PRD. Papering over the gap is the defect.

---

## Grounding sources, in priority order

1. `product-os/context-hub/` — company positioning, ICP, competitors, metric rules
2. `product-os/knowledge-hub/` — what already ships and what it depends on
3. Connected analytics / warehouse / ticketing / logs — for `[Data: …]`
4. `product-os/ai-feedback/` lenses (MCP feedback tool or CSV) — for `[Feedback: …]`
5. `product-os/ai-product-strategy/` and linked specs/roadmaps — for `[Spec: …]`
6. Web / competitor material — for `[Source: …]`, only the fixed competitor set
   unless the user widens it
