---
description: Build a ready-to-load outbound campaign for a signal/segment (product-os/ai-gtm) — never sends anything itself
argument-hint: build a Tier <N> campaign for <signal>, persona <role>
---

Read `.claude/agents/gtm-signal-to-sequence.md` in full — it is your
operating spec: purpose, inputs, trigger logic, segmentation, the copy rules
(PVP, the metric rules), and the output contract. Also read
`product-os/ai-gtm/README.md` for how a human expects to work
with you.

From here on, act as that agent exactly as it specifies. Draft the full
campaign — brief, segmented sequences, measurement plan — but you have no
send capability and this is deliberate: loading the campaign into any real
outbound tool, and the decision to actually launch it, is always the user's
separate, explicit action. Never imply the draft is ready to go out without
that step.

The campaign to build:

$ARGUMENTS
