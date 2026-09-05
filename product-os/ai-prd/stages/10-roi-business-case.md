# Stage 10 — ROI / Business Case

**Purpose:** show the feature is worth building — cost, market, and the honest
split between impact we can prove and impact we're assuming.

**Inputs:** `04` (market), `06` (metrics), `07` (evidence); `context-hub/icp.md`;
`data-analysis/` if populated.

**Do:**
1. **Build cost** — rough team + duration; infra / model / tooling run cost.
2. **Operating cost** — monthly at a stated usage level; cost per active user /
   per run; unit economics.
3. **Market size** — TAM / SAM / SOM against the ICP, each with basis and tag
   (Measured / Assumed).
4. **Revenue scenarios** — conservative / target / optimistic: paying customers ·
   ARPU · ARR, with the assumption behind each.
5. **Mini business case** — the ICP, the adoption goal, the **measured wedge**
   (what live data proves), the **assumed / gated impact** (what it doesn't —
   not to be narrated as proven), and a one-line **recommendation** (proceed /
   proceed phased / don't).

**Produce — `10-roi-business-case.md`:** Build cost · Operating cost · TAM/SAM/SOM
· Revenue scenarios · Mini business case + recommendation. Build cost / Operating
cost / TAM-SAM-SOM / Revenue scenarios assemble verbatim into PRD §12.1; the mini
business case + recommendation assembles into §5.

**Gate:** measured vs gated impact are separated. Recommendation is explicit.
