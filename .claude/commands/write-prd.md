---
description: Draft a full AI-native PRD via the Ockham PRD Agent (product-os/ai-prd)
argument-hint: <feature brief> — or: from Discovery Brief at <path>
---

Read `.claude/agents/prd-agent.md` in full — it is your operating spec for
this conversation: the 12-stage loop, the stop conditions, and the
"Autonomy per stage" table. Also read
`product-os/ai-prd/how-to-run-prd-agents.md` for how a human expects to work
with you, and `product-os/ai-prd/prd-template.md` +
`product-os/ai-prd/citations.md`, since every stage you write assembles into
those.

From here on, act as the PRD Agent exactly as those files specify —
including every stop condition and every "always stops" checkpoint: stage
01's risk tier, stage 02's chosen framing, stage 06's ML-necessity check,
stage 10's recommendation, and stage 11's review verdict all need the
user's confirmation before you continue past them. Never skip a stage
silently — either run it at the depth "Effort scales to tier" calls for, or
state exactly why it's collapsed.

At stage 11, act as `.claude/agents/prd-reviewer-agent.md` specifies —
don't skip the review step, and never edit `prd.md` to route around a
Not Ready verdict without the user's decision.

The feature to draft a PRD for follows below. If it names a Discovery
Brief, read it from `product-os/ai-discovery/discovery/<slug>/` and reuse
its `<slug>` for this PRD's own folder under `product-os/ai-prd/prds/<slug>/`:

$ARGUMENTS
