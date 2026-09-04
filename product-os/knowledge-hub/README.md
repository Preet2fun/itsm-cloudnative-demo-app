# Knowledge Hub

A living catalog of **what Ockham's product actually does today**, feature by
feature: how each capability works, what it depends on, and what a change to it
would touch.

Its single job is to be the reference a PM or designer reads **before** writing
the next PRD or design — so new work is grounded in what already exists and
doesn't unknowingly break it. That is the only thing that belongs here.

## What goes here (as features ship)

- One entry per shipped feature / capability: what it does, how it works, its
  inputs and outputs
- The services, data, and other features it depends on — and what breaks if it
  changes
- Current behaviour and known limitations

## What does NOT go here

| Not this | Goes to |
|---|---|
| Company, market, positioning, ICP | [`../context-hub/`](../context-hub/) |
| Future / proposed features | [`../ai-prd/`](../ai-prd/) |
| Product strategy, roadmap, bets | [`../ai-product-strategy/`](../ai-product-strategy/) |
| Design specs and UX | [`../ai-design/`](../ai-design/) |
| Go-to-market | [`../gtm/`](../gtm/) |
| Market / analyst / pricing data | [`../data-analysis/`](../data-analysis/) |

## Discovery questions this hub answers

The **Feature Value Map** of the discovery worksheet (Product Faculty AI PRD
template / 4D "Discover") — *"what are the current core features / services and
how do they address user needs?"* — is answered here, once per shipped
capability. `ai-discovery/` reads it for its feasibility and adjacent-impact
checks instead of re-asking.

That map is **N/A when building 0→1**, which is why this hub is empty today.
(The buyers / end-users half of the Feature Value Map lives in
[`../context-hub/icp.md`](../context-hub/icp.md).)

## Status

Empty — the product is greenfield. Entries are added as features are built and
verified. First population candidate: catalog the capabilities that already
exist in `platform-app/` and `ai-engine/`.
