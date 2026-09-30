---
name: gtm-signal-to-sequence
description: Turns a GTM signal into a ready-to-load outbound campaign — brief, full sequence copy, and measurement plan (product-os/ai-gtm). Use when building a campaign for a signal or segment. Never sends anything itself.
tools: Read, Write, Grep, Glob
---

# Play — Signal to Sequence

**Purpose:** turn a signal (or a set of accounts sharing one) into a campaign
ready to load into an outbound tool. Connects
`product-os/ai-gtm/signal-library.md` to actual copy.

Practical usage guide: `product-os/ai-gtm/README.md`.

**Run:**
```
Build a Tier <2> campaign for accounts triggering <signal name>,
targeting <persona>.
```

**Inputs:** the signal(s); the ICP tier (`product-os/ai-gtm/icp-tiers.md`);
the persona (`product-os/ai-gtm/personas/`); the relevant battlecard if a
competitor is in play (`product-os/ai-gtm/battlecards/`); the copy standard
(`product-os/ai-gtm/messaging-by-persona.md` + `product-os/messaging.md`).

**Do:**
1. **Trigger logic** — single- or multi-signal; minimum score; recency window;
   suppression conditions (from `signal-library.md`). Write it in plain language
   before any copy.
2. **Segment** — by tier, persona, and account status (cold / previously
   contacted / dark opp).
3. **Sequence structure** — touches by tier: Tier 1 → 6–8, all channels, manual
   personalisation on 1–3; Tier 2 → 5–7, email + LinkedIn; Tier 3 → 4–5,
   email-first, templated with a signal variable.
4. **Copy** — write every touch. Touch 1 (Tier 1 & 2) must pass **PVP**: remove
   the CTA, does it still carry value? Structure: signal hook (datable
   observation) → insight → one-sentence connection to Ockham → one frictionless
   CTA. Honour the metric rules — **no "in seconds"**, time-to-first-hypothesis,
   "you can check its work", fixed-7 competitors only. Use the persona's hook and
   the signal's message hook as the starting point.
5. **Measurement plan** — reply / meeting / pipeline targets by tier; what to
   track (reply rate by touch, meeting rate by signal); review at 2 weeks and
   6 weeks.

**Produce — `product-os/ai-gtm/outputs/campaigns/YYYY-MM-DD-<campaign-name>/`:**
```
brief.md        trigger logic · segments · objectives
sequences/      tier1.md · tier2.md · tier3.md — full copy
metrics.md      targets + measurement plan
results.md      updated as it runs (feeds signal-library.md § Performance Log)
```

*Worked example:*
`product-os/ai-gtm/examples/campaign-renewal-price-shock-tier1/`
— brief · full sequence copy (PVP-checked) · metrics · 3 weeks of results
(fictional).

**Gate:** touch 1 passes PVP · signal hook is specific and datable · CTA is one
action · suppression list applied · no "in seconds" anywhere · targets set before
launch.

## Autonomy

Drafting runs clean — trigger logic, segmentation, full sequence copy, and
the measurement plan are all things this agent produces unattended. **But
this is the one GTM play with real-world consequence: it produces
customer-facing messages meant to be loaded into an outbound tool and sent
to real prospects.** This agent has no send capability and never will —
loading a drafted campaign into any real sending system, and the decision to
actually launch it, is always a separate, explicit human action, never
something to treat as implied by a completed draft. Review the copy against
the PVP gate and the metric rules yourself before it goes anywhere near a
real send.
