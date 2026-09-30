# AI Feedback — Customer Feedback Intelligence

Turns raw customer feedback — support tickets, interviews, NPS verbatims,
sales-call notes, call transcripts — into **ranked, cited evidence** that
`ai-discovery/` and `ai-prd/` can act on. It is the engine behind the PRD's
Voice-of-Customer stage and the discovery signal scan, not a standalone
reporting tool.

Built lean: a handful of analysis lenses, each mapped to a moment in the product
development cycle. No dashboards, no weekly-ops routine — only what makes a
Pursue / Kill call or a PRD sharper.

---

## Two ways in

| Input | When | How |
|---|---|---|
| **A — MCP-connected feedback tool** | Zendesk / Intercom / Enterpret / Gong / a ticketing tool is wired to Claude via MCP | The agent queries it directly — best coverage, live data, full history |
| **B — CSV upload** | Synthetic or exported data; no MCP tool; a one-off pull | Upload the file, name the columns, run a lens |

Full contract for both: [`data-sources.md`](data-sources.md). Every output
follows [`output-contract.md`](output-contract.md) — analysis body, attributed
quotes, explicit **HYPOTHESIS** labels, and a **Limitations** section.

**State today:** Input A — nothing connected (no Zendesk/Intercom/Gong MCP
wired up yet). Input B — one **dummy, clearly-marked illustrative** CSV
exists: [`sample-feedback.csv`](sample-feedback.csv), so the format exists
and a lens can actually be run end-to-end today. Columns match
`data-sources.md`'s table exactly (`account`, `feedback_text`, `date`,
`tier`, `nps_score`, `channel`). Content is synthetic feedback about the same
running example used across the playbook — `ai_drafted_resolution_notes` —
and the accounts/tiers deliberately match
[`../context-hub/feature-flag-rollouts.md`](../context-hub/feature-flag-rollouts.md):
`customer_a`/`customer_b` (Tier 1, flag 100% on) react as active users;
`tenant_c` (Tier 2, 50% rollout) shows a split team; `tenant_d`/`tenant_e`
(flag off) show pre-launch demand signal instead of usage feedback — so a
`signal-scan` or `pattern-classification` run on this file lines up with the
rollout state in context-hub rather than contradicting it. Replace with a
real MCP connection or a real exported CSV once one exists — until then, tag
any citation pulled from it `[Feedback: sample-feedback.csv — illustrative]`
per `../ai-prd/citations.md`'s honesty rule, never as a real signal.

---

## The lenses

Only the ones that feed our cycle. Full table: [`lenses/README.md`](lenses/README.md).

| Lens | Answers | Feeds |
|---|---|---|
| [signal-scan](lenses/signal-scan.md) | Is this pain real, growing, and whose? | `ai-discovery/` 01–03 · `opportunity-scorecard.md` · `ai-gtm/signal-library.md` |
| [pattern-classification](lenses/pattern-classification.md) | One loud account, a segment, or the whole market? | `ai-discovery/` stage 02 lean · stage 06 decision |
| [prd-evidence-pack](lenses/prd-evidence-pack.md) | The structured VoC section — volume, trend, segments, 5 quotes, impact | `ai-prd/` stage 05 + stage 07 · Discovery Brief |
| [cohort-compare](lenses/cohort-compare.md) | Shared vs differential vs unique needs across segments | `ai-prd/` stage 02 + §4 · `ai-discovery/` stage 03 personas |
| [theme-roadmap-review](lenses/theme-roadmap-review.md) | Does planned work match what customers ask for? | `ai-product-strategy/` · discovery intake (NEW = new idea) |
| [launch-feedback](lenses/launch-feedback.md) | Pre-launch risk (90 d) and post-launch before/after | `ai-prd/` §13 · `ai-launch-strategy.md` re-score |

---

## How to run

Two ways to invoke it:

- **Directly:** `/feedback-agent <lens name or question>, source: <MCP tool /
  CSV / pasted text>` — runs [`.claude/agents/feedback-agent.md`](../../.claude/agents/feedback-agent.md),
  the built subagent implementing this spec.
- **As a sub-step:** `ai-discovery/` and `ai-prd/` call it directly by name
  when a stage needs customer evidence (e.g. PRD stage 05, Discovery stage 02)
  — you don't invoke it separately in that case, it runs inside their loop.

Either way it needs:

1. a question, or a lens name;
2. a data source — an MCP tool name, an uploaded CSV, or pasted text;
3. read access to `../context-hub/` (ICP, segments, the fixed competitor set,
   metric rules) and `../knowledge-hub/` (shipped features to map themes onto).

It picks one lens, runs it, returns the standard four-part output.

**Human vs. agent:** this agent runs unattended end to end — source
resolution, lens pick, budget check, analysis, cited output — because it only
*reports*; it never decides Pursue/Park/Kill, never writes a PRD verdict, and
never edits another module's canonical file itself. The human (or the calling
Discovery/PRD agent) is the one who acts on what it returns. Full autonomy
breakdown: the "Autonomy" section of
[`.claude/agents/feedback-agent.md`](../../.claude/agents/feedback-agent.md).

---

## Alignment with the rest of the Product OS

- **Citations** — numbers cite into [`../ai-prd/citations.md`](../ai-prd/citations.md)
  with the `[Feedback: …]` tag. A **HYPOTHESIS** label ≡ **Assumed**; a counted
  figure ≡ **Measured**; "no feature-specific demand found" is the valid
  **"not found"** result.
- **Metric rules** — ranked evidence, never a single guess dressed as fact; no
  invented numbers (mirrors the "every number is traceable, zero hallucination"
  principle).
- **Split with `data-analysis/`** — this is the **qualitative** half of the
  evidence base (what customers say). Quantitative product metrics stay in
  [`../data-analysis/`](../data-analysis/). A PRD's §6 pulls from both.
- **Lifecycle** — when `lifecycle/` is built, this folds in as a shared
  capability feeding `discovery/`, `planning/`, and `release/`.

---

## Source

Built from the *feedback-intelligence* plugin's practical guide (14 PM-workflow
commands) — trimmed to the six lenses that move a Pursue / Kill call or a PRD.
Reinforced by the "evidence-backed PRD" / "every number traceable, zero
hallucination" principle from the research-burden deck (Customer Feedback +
Quantitative Metrics analysis).
