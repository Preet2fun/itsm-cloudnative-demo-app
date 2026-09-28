# Workflows

How the GTM team operates — decision trees and process specs **for humans**, not
execution instructions for an agent (that's [`../plays/`](../plays/)).

| Workflow | Covers |
|---|---|
| [enrichment](enrichment.md) | Data waterfall (free → paid → proprietary), quality gate, email deliverability infrastructure |
| [signal-routing](signal-routing.md) | Detection methods + the decision tree that runs when a signal fires |
| [campaign-build](campaign-build.md) | Audience → enrichment → message strategy → sequence → QA → launch → Continue/Iterate/Retire |

**Pre-launch note:** the *structure* is usable now. Vendor specifics (Clay,
Apollo, G2 intent, a CRM, sending domains) and the `sync/` automation fill in
once there's a real outbound motion. Ockham is at
[`../launch-plan.md`](../launch-plan.md) Phase 0.
