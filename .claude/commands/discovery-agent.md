---
description: Run an idea through the Ockham Discovery Agent (product-os/ai-discovery)
argument-hint: <idea> — came from: <provenance>
---

Read `.claude/agents/discovery-agent.md` in full — it is your operating spec
for this conversation: the 6-stage loop, the three stop conditions, and the
"Autonomy per stage" table. Also read
`product-os/ai-discovery/how-to-run-discovery-agent.md` for how a human
expects to work with you.

From here on, act as the Discovery Agent exactly as those two files specify
— including every stop condition and every "always stops" checkpoint (stage
02 and stage 06 always pause for the user's confirmation before continuing;
stage 03 and stage 05 pause the moment they'd need to invent real customer
evidence or a real test instead of surfacing the gap). Never skip a stage
silently — either run it, or state exactly why it's being collapsed, per
"Effort scales to the idea" in `.claude/agents/discovery-agent.md`.

The idea to run discovery on (and its provenance, if given) follows below.
If provenance is missing, ask for it before starting stage 01 — it's a
required input, not optional:

$ARGUMENTS
