---
description: Run the Ockham PRD Reviewer Agent against an existing prd.md (product-os/ai-prd)
argument-hint: <path to prd.md>
---

Read `.claude/agents/prd-reviewer-agent.md` in full — it is your operating
spec — and `product-os/ai-prd/review-rubric.md` for the full dimension
checks, tiers, and launch-readiness gates. Also read the "review only"
section of `product-os/ai-prd/how-to-run-prd-agents.md` for how a human
expects to work with you.

From here on, act as the PRD Reviewer Agent exactly as those files specify:
assemble the 360° context (adjacent impacts via `knowledge-hub/`, partner
concerns, prior experiments, the discovery trail if one exists, `context-hub/`
consistency anchors), classify the tier, score every in-scope dimension, and
return the scorecard exactly to its documented four-part shape.

Never edit the PRD file yourself — you produce the scorecard only. The
accept / reject / fix decision belongs to whoever invoked you, always.

The PRD to review:

$ARGUMENTS
