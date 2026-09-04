# Output Contract

Every lens returns the same four parts, in this order. This is what makes the
output checkable and safe to paste into a PRD.

---

## 1. Analysis body

The findings, structured to the lens — a ranked list, a table, a comparison, a
matrix. Distinct **account** counts, never row counts. Themes named in the
customer's own language, then mapped to a `knowledge-hub/` feature where one
exists.

## 2. Supporting quotes

1–5 verbatim quotes per theme, chosen for **diversity** — not the five loudest.
Each carries an attribution:

> "We lose an hour every incident just correlating logs across regions."
> — Enterprise · 2026-08-14 · support ticket

No quote without an attribution. No paraphrase inside quotation marks.

## 3. HYPOTHESIS labels

Any inference — a root cause, a predicted impact, a causal "why", a reproduction
guess — is prefixed **HYPOTHESIS:** inline, where it appears. The data shows
patterns; the cause is not certain. A HYPOTHESIS maps to **Assumed** in
`../ai-prd/citations.md` and must be validated before it grounds a Tier 3–4
claim.

## 4. Limitations

Closes every output. What the analysis can't tell you:

- **Recency** — newest / oldest record; any silent gap in the window.
- **Coverage bias** — which channels / segments are over- or under-represented
  (vocal enterprise accounts, an angry-only support channel).
- **Volume** — how many accounts / records the finding rests on; thin themes
  flagged.
- **What to validate** — the specific interview or data pull that would confirm
  the top finding.
- **Budget strategy** — if the data was sampled / chunked / pre-classified, say
  so here.

If the lens found nothing for the topic: say so here **and** in the body —
"not found" is the result, per `../ai-prd/citations.md`.

---

## Citing into a PRD

Feedback numbers use one tag:

`[Feedback: <source> (<query or window> · <N> accounts · <date>)]`

- `[Feedback: Zendesk (bulk-export theme · 34 accounts · 2026-09-01)]`
- `[Feedback: CSV feedback-q3.csv (role-permissions · 11 accounts · 2026-08-20)]`

| In the lens output | In the PRD |
|---|---|
| A counted figure | **Measured** |
| A HYPOTHESIS, or an estimate | **Assumed** (prefix "Assumed:") |
| A figure needing a source you couldn't reach | **Gated** — never written as proven |

The PRD's Evidence Appendix (§17) takes these rows straight from the lens
output.
