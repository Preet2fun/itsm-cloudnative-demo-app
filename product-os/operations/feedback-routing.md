# Feedback Routing

The mechanics of a customer-reported production issue flowing to the module
that actually acts on it — instead of sitting in a support queue. This is the
piece §9 of `ai-pdlc-playbook.md` named as the real gap: `ai-feedback/`
analyzes feedback that's already in the system, but nothing until now said how
a fresh report gets into that system, or past it, in the first place.

---

## The routing decision

Ask these in order. Stop at the first "yes."

1. **Is this a straightforward software defect — not a judgment call by the AI
   agent?** (a broken button, a 500 error, a UI bug)
   → **Engineering's own bug tracker.** Outside `product-os/` entirely — this
   doc only routes issues that involve a product or AI-judgment decision.

2. **Is this the AI agent being wrong** — a bad RCA, a missed detection, a
   hallucinated citation, a confidently wrong recommendation?
   → [`failure-triage-log.md`](failure-triage-log.md). Log it there first,
   even if it turns out cosmetic — the triage log is what decides severity,
   not this routing step.

3. **Is this an opinion or a request, not a "the agent was wrong" claim** —
   "I wish it also did X," "the notes miss context I care about," a feature
   ask?
   → `ai-feedback/`. Two sub-cases:
   - Matches something already on the roadmap → run
     [`../ai-feedback/lenses/theme-roadmap-review.md`](../ai-feedback/lenses/theme-roadmap-review.md)
     next cycle to weigh it against the current plan.
   - No roadmap item covers it → run
     [`../ai-feedback/lenses/signal-scan.md`](../ai-feedback/lenses/signal-scan.md)
     to size it before treating it as more than one account's ask.

4. **Does this recur across multiple, unrelated reports in a way that points
   at a systemic direction problem** — not "the feature is missing X" but "we
   built the wrong thing" or "we're solving the wrong buyer's problem"?
   → Flag for `../ai-product-strategy/`. That folder is scaffold-only today
   (see its own README) — flagging means logging the pattern and the reports
   behind it, not writing directly into a strategy artifact that doesn't
   exist yet. Same "flag, don't force a landing spot" treatment
   `ai-discovery/` stage 06 already uses for the same folder
   (`product-os/TODO.md` item 1).

A single report can route to more than one place — a hallucinated citation
that also reveals customers want more transparency into "what the AI is
inferring vs. pulling from logs" is both a `failure-triage-log.md` entry *and*
a `signal-scan` candidate.

---

## Who does the routing, today

Manual — a human (support or CSM) reads this doc and makes the call. The
lifecycle table in `product-os/README.md` already names the eventual owner:
a **"Support · Ops · SRE Agent"** producing a *"triage report, pull
request"* — this routing tree is that agent's future decision logic, written
down before the agent exists, not after.

---

## Upstream

Customer-reported issues, from any channel `../ai-feedback/data-sources.md`
already lists (support ticket, in-app survey, CSM check-in, sales call).

## Downstream

[`failure-triage-log.md`](failure-triage-log.md),
[`../ai-feedback/`](../ai-feedback/) (signal-scan / theme-roadmap-review),
[`../ai-product-strategy/`](../ai-product-strategy/) (flagged only).

## Status

Framework only — no live routing history yet (pre-launch; no support queue
exists to route from today).
