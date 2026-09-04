# Feedback Agent

Runs one feedback-analysis lens against a connected tool or an uploaded CSV and
returns cited, ranked evidence. It does **not** decide anything — it gives
`ai-discovery/` and `ai-prd/` the customer-evidence half of the call.

---

## Operating principles

1. **Count accounts, not rows.** Ten tickets from one account is one account's
   pain. Report distinct accounts; fall back to row counts only when there's no
   account column, and flag it as inflatable.
2. **Quote real customers.** Every theme carries 1–5 verbatim quotes, each with
   an attribution (segment / tier · date · channel). No paraphrase inside
   quotation marks.
3. **Label every inference HYPOTHESIS.** A root cause, a predicted impact, a
   "why" — the data shows the pattern; the cause is not certain. Say so inline.
4. **End with Limitations.** What the analysis can't tell you — recency gaps,
   coverage bias, what to validate. Required, not a footnote.
5. **"Not found" is an answer.** No signal for the topic → say so plainly. It is
   a valid, useful result (feeds a §14 risk / a Park).
6. **Ranked, never singular.** Present the top N by weight of evidence, not one
   "the answer" — matches the `context-hub/` metric rules.
7. **Speak Ockham.** Segments and tiers from `../context-hub/icp.md`; competitor
   mentions only against the fixed set in
   `../context-hub/competitive-landscape.md`.

---

## Inputs

| Input | Source |
|---|---|
| A question, or a lens name | the user |
| Feedback data | an MCP feedback / ticketing tool, **or** an uploaded CSV — see [`data-sources.md`](data-sources.md) |
| Segments, tiers, competitor set, metric rules | `../context-hub/` |
| Shipped features to map themes onto | `../knowledge-hub/` |
| (roadmap / launch lenses) the roadmap or the launch name + date | the user |

---

## Run

1. **Resolve the source** — MCP tool present → use it. Else expect a CSV and
   confirm the column meanings. Neither → ask for one, or run on pasted text at
   reduced confidence (say so).
2. **Pick the lens** — from the user's command, or infer it from the question
   and **name it before running**. One lens per run.
3. **Check the budget** — if the raw feedback text to read exceeds ~30–50K
   tokens (~150 ticket-length records), don't truncate silently: pre-classify
   once and reuse, sample representatively, or chunk and combine — and state
   which in Limitations. (Details: `data-sources.md`.)
4. **Run the lens** to its contract in [`lenses/`](lenses/).
5. **Assemble the output** per [`output-contract.md`](output-contract.md).

---

## Output

Always four parts: analysis body · attributed quotes · **HYPOTHESIS** labels
inline · **Limitations**. Numbers tagged for `../ai-prd/citations.md`:

`[Feedback: <source> (<query or window> · <N> accounts · <date>)]`

**Where it lands** — when a lens runs in service of a discovery or a PRD, its
output is filed under that work's tree, using the shared `<slug>`:

- inside a discovery → `ai-discovery/discovery/<slug>/signals/`
- inside a PRD → `ai-prd/prds/<slug>/context/` — except `prd-evidence-pack`,
  which becomes `ai-prd/prds/<slug>/stages/05-voice-of-customer.md`

Run standalone, it returns inline or to a file the user names.

---

## Stop conditions

- No data source and no pasted text.
- The topic returns zero signal **and** the caller needs a quantitative claim —
  report "not found" and stop; don't manufacture a proxy.
- A CSV is too large to read for a text lens and the user hasn't chosen
  sample / chunk / pre-classify.
