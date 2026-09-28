# Product OS — Parked Items

Things found true during the stage-by-stage gap review of Product OS that
are **not fixable right now** — either because they wait on a decision only
the user can make, or on real data/business facts that don't exist yet. Not
a build roadmap and not tracked on a GitHub board — just a running list so a
real gap doesn't quietly get forgotten between sessions. Add to this as the
review continues through `ai-prd/` and beyond.

Each item: where it came from, why it's parked, what would unblock it.

---

## From `ai-discovery/` review (2026-09-27)

1. **Stage 06's handoff to `ai-product-strategy/` has no real landing spot.**
   `ai-discovery/stages/06-decision-and-brief.md` says: *"if the underlying
   signal keeps recurring across ideas, flag it for
   `../ai-product-strategy/`."* But `ai-product-strategy/` is scaffold-only
   today — nothing exists there to actually flag it into.
   **Why parked:** user's call — `ai-product-strategy/` needs real alignment
   with the Ockham product direction first, not a placeholder built ahead of
   that work.
   **Unblocks when:** the user is ready to work on `ai-product-strategy/`
   for real.

2. **`ai-gtm/pricing-and-packaging.md` is thin.**
   Affects `data-analysis/impact-estimation.md`'s **Value per Action** term
   (ties to the edition ladder — Observe / Observe+Secure / Autonomous — which
   isn't priced out yet), and indirectly stage 02's opportunity scoring
   through that same formula.
   **Why parked:** a real pricing/packaging decision, not something to build
   around or guess at.
   **Unblocks when:** Ockham's pricing/packaging is actually decided.

---

## Not on this list on purpose

Things already identified but genuinely self-resolving, not "parked" —
listed here once so they're not re-discovered as if new: `knowledge-hub/`
being empty (fills in once something ships), no real prior experiments in
`calibration-log.md` yet (fills in after the first real ship/iterate/kill
call), `ai-feedback`/`context-hub` usage data still being dummy/illustrative
(fills in once a real MCP tool or export exists).
