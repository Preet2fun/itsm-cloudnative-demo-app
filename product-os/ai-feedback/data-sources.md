# Data Sources — MCP or CSV

Two inputs. Both run the same lenses; they differ only in coverage and
freshness.

---

## Input A — MCP-connected feedback tool  *(best coverage)*

An MCP server for a feedback or ticketing platform (Zendesk, Intercom,
Enterpret, Gong, Freshdesk, a warehouse view, …) exposed to the agent.

- The agent queries it directly — no export step, live data, full history.
- Tell the agent the tool name once: *"use the Zendesk MCP for feedback."*
- Account, date, tier, and channel usually arrive as structured fields — every
  lens runs at full fidelity.
- Pull scope **down to the topic / window** the lens needs; don't read the whole
  corpus into context (see the token budget below).

---

## Input B — CSV upload

Export or synthesise the data, upload the file, name the columns.

**Columns that matter** — missing ones degrade gracefully (the agent says what
it can't compute and why):

| Column | Unlocks |
|---|---|
| Account / company name | Distinct-account counts (vs raw row counts) |
| Feedback text | Everything text-based — themes, quotes, classification |
| Date | Trends, period comparisons, recency (`signal-scan`, `launch-feedback`) |
| Tier / segment | Cohort analysis, urgency weighting (`cohort-compare`) |
| NPS / score | Detractor vs promoter framing, where present |
| Channel / source | Quote attribution, source breakdown |

Name non-obvious columns on upload: *"`org` is the account, `verbatim` is the
text, `submitted_at` is the date."*

---

## The token budget — the limit you hit first

Two ceilings, and they bite at different points:

1. **File size** — the app caps individual uploads (~30 MB in the Claude app;
   much larger via the API if you build your own pipeline). Product limits move
   — check current Anthropic docs, don't treat a number as fixed.
2. **Text the model must read** — the real ceiling. Pure aggregation (counts,
   trends, sentiment splits **when the column already exists**) runs in the
   processing sandbox and scales to very large files. Any step that reads raw
   text — classifying, quoting, theme synthesis — is bounded by the context
   window: a working budget of **~30–50K tokens of raw feedback per pass**
   (~120–200K characters, ~150 support-ticket-length records).

**When the text exceeds the budget** — don't upload a bigger file:

| Strategy | What it means |
|---|---|
| **Pre-classify once** | Label every record (theme · sentiment · severity) in one pass, save the labelled file, reuse it for every later lens |
| **Sample** | A representative subset (by segment / time); analyse that; note the sampling |
| **Chunk and combine** | Split, run the lens per chunk, merge the results |

The agent states which strategy it used in **Limitations**.

---

## Graceful degradation

| Missing column | Effect |
|---|---|
| Date | `signal-scan` trend and `launch-feedback` before/after are skipped, with a note; point-in-time findings still run |
| Account | "distinct accounts" falls back to row counts, flagged as inflatable |
| Tier / segment | `cohort-compare` can't run; other lenses run market-wide |
| NPS | detractor / promoter framing omitted; theme ranking still runs |

The analysis still runs — it just carries the caveat.

---

## Option C — pasted text

No file, no tool: paste tickets, interview notes, or a feedback summary into the
conversation and run a lens. Output quality scales with what you provide; the
agent flags the reduced confidence and skips any count it can't support.
