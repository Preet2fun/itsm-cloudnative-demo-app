# Stage 05 — Assumption & Risk Map

**Purpose:** find the assumptions the opportunity **and the lead solution shape**
rest on, and decide which must be tested *before* a PRD is worth writing.

**Inputs:** `01`–`04` — especially the evidence-gap list (03) and the lead
solution shape + alternates (04).

**Do:**
1. **List the assumptions** across four kinds:
   - **Desirability** — users want this and will change behaviour for it.
   - **Viability** — it's good for Ockham: pricing, positioning, run cost.
   - **Feasibility** — we can build and operate it.
   - **Safety / ethics** — autonomy level, trust, data handling.
2. **Rate each:** confidence (low / med / high) × impact-if-wrong (low / med /
   high).
3. **Classify:**
   - **Test before PRD** — low confidence + high impact. Name the cheapest test:
     5 interviews, a data pull, a fake-door, a competitor teardown.
   - **Test during PRD** — the PRD's evidence stages will cover it.
   - **Accept** — high confidence or low impact; state it and move on.

**Produce — `05-assumption-and-risk-map.md`:** the assumption table (assumption ·
kind · confidence · impact · class · cheapest test).

**Gate:** every "test before PRD" item has a named, cheap test. If there are
none, the opportunity is ready for a decision.
