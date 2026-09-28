# How to Run the PRD Agent (and PRD Reviewer)

A practical guide, not a restatement of the spec. Full detail lives in
[`../../.claude/agents/prd-agent.md`](../../.claude/agents/prd-agent.md) (the
drafting agent's operating rules — including "Autonomy per stage"),
[`../../.claude/agents/prd-reviewer-agent.md`](../../.claude/agents/prd-reviewer-agent.md)
(the review agent — both live under `.claude/` since they're Claude Code
subagent definitions, not tool-agnostic content), and
[`../ai-pdlc-playbook.md`](../ai-pdlc-playbook.md) §4.1–§4.12 (input /
working-flow / output, stage by stage). This is only what you need to
actually use them.

---

## Two ways to start

**Draft a new PRD** — in Claude Code, run `/write-prd <feature brief>`.
With any other tool, or to run manually: point an agent at
`.claude/agents/prd-agent.md`, give it a feature brief (or a path to a
Discovery Brief at `product-os/ai-discovery/discovery/<slug>/`), and read
access to `../context-hub/`, `../knowledge-hub/`, and any connected
analytics/data/research. It runs stages 01 → 12, writing each stage
artifact, then assembles `prd.md`.

One line: *"Write a PRD for: `<feature>`. Brief: `<what you know>`"* — or
*"...from the Discovery Brief at `<path>`."*

**Review an existing PRD** — in Claude Code, run `/review-prd <path to
prd.md>`. With any other tool: point an agent at
`.claude/agents/prd-reviewer-agent.md` and a `prd.md` path. Runs the same
360°-context assembly, tier classification, and seven-dimension scoring,
standalone — no drafting loop needed.

One line: *"Review `<path to prd.md>`."*

## What happens without you — drafting

| Stage | Autonomy |
|---|---|
| 01 Idea brief | Runs clean, except the risk tier — **always confirm** before continuing |
| 02 Requirements | Drafts all framings, then **always stops** before locking in the chosen one |
| 03 Knowledge gathering | Runs clean |
| 04 Market & competitor research | Runs clean |
| 05 Voice of customer | Runs clean on whatever's connected; stops the moment real demand isn't found — someone has to go get more signal, the agent can't |
| 06 Metrics & AI design strategy | Drafts everything, then **always stops** on the ML-necessity check specifically |
| 07 Evidence gathering | Runs clean — live MCP queries included |
| 08 Visual strategy | Runs clean, including the actual Claude Design draft |
| 09 Prototype summary | Runs clean |
| 10 ROI / business case | Drafts everything, then **always stops** before the recommendation is final — also blocked whenever real pricing (`ai-gtm/pricing-and-packaging.md`) doesn't exist yet |
| 11 Draft PRD & review | Runs the full assemble → review → fix loop, then **always stops** to present the scorecard before calling it done |
| 12 Final checklist | Runs clean; any box it proposes to waive needs your say-so, every time |

Full reasoning for each row: `.claude/agents/prd-agent.md`'s "Autonomy per
stage" section.

## What happens without you — review only

The reviewer runs its whole job unattended — 360° context, tier, all seven
dimensions — and never edits `prd.md` itself. It always hands you the
scorecard; what you do with a **Not Ready** or **Ready with Caveats**
verdict is always your call, not something it resolves on its own.

## What you'll actually be asked for

1. **"Is this real?"** — stage 05, when a claim needs real customer evidence
   that isn't connected yet; stage 10, when a number needs real pricing
   that isn't decided yet.
2. **"Do you agree?"** — stage 01 (tier), stage 02 (framing), stage 06
   (ML-necessity), stage 10 (recommendation), stage 11 (review verdict).
   Five checkpoints, not one — PRD carries more resourcing weight per stage
   than Discovery did.
3. **"You call it"** — a brief with two readings that change scope (stage
   01); a Not Ready review needing a decision the agent can't make from
   context — pricing, a policy owner, a strategy call (stage 11); any
   checklist box that needs waiving (stage 12).

## Where things land

Every artifact for one feature lives under `ai-prd/prds/<slug>/` —
`stages/`, `context/`, `prototype/`, and the assembled `prd.md` at that
folder's root. Same `<slug>` its Discovery Brief used, if it has one.
**This folder doesn't exist yet anywhere in the repo** — created the first
time a real feature runs through the loop. Full path-by-path detail:
`../ai-pdlc-playbook.md` §4.1–§4.11.

## Effort still scales to tier

Tier 1 (UX parity/copy) → stages 01, 02, 06 (metrics only), 11, 12; the rest
are a line each or "N/A." Tier 2 (incremental/internal tooling) → all
stages, but 04/09/10 are a paragraph. Tier 3–4 (net-new/new data/policy/
pricing) → the full loop, AI addendum and eval plan mandatory. The autonomy
table above applies to whichever stages actually run —
`.claude/agents/prd-agent.md`'s own "Effort scales to tier" section decides
which those are.
