# How to Run the GTM Agents

A practical guide, not a restatement of the spec. Full detail lives in each
play's agent definition — `../../.claude/agents/gtm-account-research.md`,
`gtm-account-scoring.md`, `gtm-signal-to-sequence.md`, `gtm-weekly-update.md`
(all under `.claude/agents/`, since they're Claude Code subagent
definitions, not tool-agnostic content) — each ending in its own **Autonomy**
note. This is only what you need to actually use them.

---

## Four independent plays, not one loop

Unlike `ai-discovery/` and `ai-prd/`, GTM isn't one agent running a
sequential stage loop — it's **four separate, independently-invocable
agents**, each one prompt in, one output out. Run whichever one the task
calls for; they don't have to run in order, and most days you'll only need
one.

## Start one

**In Claude Code:**
```
/gtm-account-research <company.com>
/gtm-account-scoring <account or list>
/gtm-signal-to-sequence build a Tier <N> campaign for <signal>, persona <role>
/gtm-weekly-update
```

**With any other tool:** point an agent at the matching
`.claude/agents/gtm-*.md` file and give it the same input the command line
above shows.

## What happens without you

| Play | Autonomy |
|---|---|
| Account research | Runs clean — research, synthesis, and the angle are all unattended. Self-limiting only: won't recommend outreach without a real, datable "why now." |
| Account scoring | Runs clean — fully deterministic (point tables + hard gates), no judgement call, no real-world action. |
| Signal to sequence | Runs clean for drafting. **Never sends anything itself** — loading the finished campaign into a real outbound tool, and the decision to launch it, is always a separate human action. |
| Weekly update | Runs the staleness check and drafts the diff unattended. **Always stops before writing**: files change only after you confirm the diff. Battlecards and the ICP Evolution Log are never drafted at all, only flagged with a question. |

## What you'll actually be asked for

1. **"Is this real?"** — account research, if it can't find a datable trigger
   (it says so and stops short of recommending outreach, rather than
   inventing one).
2. **"You call it"** — weekly update's diff, every time, before anything gets
   written; signal-to-sequence's finished campaign, before it goes anywhere
   near a real send; any battlecard or ICP-drift question weekly-update
   surfaces but won't answer itself.
3. Account scoring almost never asks you anything — it's the one fully
   mechanical play of the four.

## Where things land

Every output files under `product-os/ai-gtm/outputs/` — dated files for
research and scoring runs, `outputs/campaigns/<name>/` for a full sequence
build, a running `outputs/weekly-log.md` line for each weekly update. This
matches the same "sample data first, replace with real signals once they
exist" discipline as the rest of Product OS — `product-os/ai-gtm/examples/`
holds fictional worked examples of each play's output today.

## Working rules that still apply, whichever play runs

- One play / one campaign at a time — run it, file the output, then the
  next.
- Never commit CRM data, contact lists, API keys, raw transcripts, or
  commercial terms.
- Every quantitative claim in an output carries a citation, same discipline
  as `ai-prd/`.
- Honor `context-hub/positioning.md`'s metric rules in all copy — never "in
  seconds," time-to-first-hypothesis framing, "you can check its work,"
  competitor references only the fixed 7.
