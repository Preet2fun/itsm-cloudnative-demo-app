# How to Run the Discovery Agent

A practical guide, not a restatement of the spec. Full stage detail lives in
[`discovery-agent.md`](discovery-agent.md) (the agent's own operating rules
— including the full "Autonomy per stage" table) and
[`../ai-pdlc-playbook.md`](../ai-pdlc-playbook.md) §3.1–§3.9 (input /
working-flow / output, stage by stage). This is only what you need to
actually use it.

---

## Start it

Point an agent at `discovery-agent.md` and give it: the raw idea, its
provenance, and anything already connected (a real ticket export,
`../ai-feedback/`'s CSV, usage data). Nothing else is required to start —
missing sources get flagged, never silently blocked on.

One line is enough: *"Run discovery on: `<idea>`. Came from: `<where>`."*

## What happens without you

| Stage | Autonomy |
|---|---|
| 01 Idea intake | Runs clean |
| 02 Opportunity scoring | Drafts, then **always stops** — confirm the AI-native verdict + lean before it continues |
| 03 Problem-space research | Runs on whatever's connected; stops the moment it would need to invent real customer evidence |
| 04 Solution hypothesis | Runs clean, start to finish |
| 05 Assumption & risk map | Drafts, then stops on any "test before PRD" item — it can name the cheapest test, it can't go run it |
| 06 Decision & brief | Drafts, then **always stops** before the decision is treated as final |

## What you'll actually be asked for

Three kinds of ask, roughly in order of how often they come up:

1. **"Is this real?"** — stage 03/05, when a claim needs real evidence
   (interviews, a data pull, a fake-door test) that doesn't exist yet. You
   either provide it, or accept the gap as a named `[Assumed]` /
   `[pre-build]` item.
2. **"Do you agree?"** — stage 02/06's checkpoints. The agent's own read, not
   a rubber-stamp request — push back if the AI-native call or the lean
   looks wrong.
3. **"You call it"** — the rare override: the idea reads two materially
   different ways (stage 01), or you want to Pursue past a failed fit gate
   (stage 06). The agent states the conflict; the decision is yours, on the
   record.

## Where things land

Every artifact for one idea lives under `ai-discovery/discovery/<slug>/` —
`stages/`, `signals/`, and the final `discovery-brief.md` or
`decision-log.md` at that folder's root. **This folder doesn't exist yet
anywhere in the repo** — it's created the first time a real idea runs
through the loop. Full path-by-path detail: `../ai-pdlc-playbook.md`
§3.1–§3.6.

## Effort still scales to the idea

Small/reversible idea → run stages 01, 02, 06 only. Net-new capability, or
anything policy-/pricing-sensitive → run the full six. This guide's autonomy
table applies to whichever stages actually run — it doesn't change *which*
ones do; `discovery-agent.md`'s own "Effort scales to the idea" section
decides that.
