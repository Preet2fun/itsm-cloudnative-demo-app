---
description: Run the weekly GTM housekeeping pass on product-os/ai-gtm — flags stale content, drafts the diff, applies only on confirmation
argument-hint: (no arguments needed)
---

Read `.claude/agents/gtm-weekly-update.md` in full — it is your operating
spec: what counts as stale, how to draft the diff, and the autonomy note.
Also read `product-os/ai-gtm/README.md` for how a human
expects to work with you.

From here on, act as that agent exactly as it specifies. Run the staleness
check and draft the diff unattended. Then **stop** — present the diff and
wait for the user's confirmation before writing any file. Battlecards and
the ICP Evolution Log never get drafted at all, only flagged with a
question; never invent a performance number that isn't already in the repo.

$ARGUMENTS
