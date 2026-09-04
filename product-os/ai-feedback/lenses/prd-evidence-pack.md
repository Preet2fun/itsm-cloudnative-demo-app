# Lens 3 — PRD Evidence Pack

**Purpose:** produce the customer-evidence section of a PRD or a proposal —
ready to paste, fully cited.

**Question:** What does the customer data say about this feature, and how solid
is it?

**Inputs:** a **specific** topic ("bulk CSV export for data teams", not
"export"); the data source; `../../context-hub/icp.md`; `../../knowledge-hub/`
for the feature it touches.

**Do:**
1. **Volume** — distinct accounts, with the query and window.
2. **Trend** — over the last 2–4 periods.
3. **Sentiment** — split; note intensity.
4. **Segment breakdown** — which tiers / verticals, weighted by account value
   where the data allows.
5. **Five quotes** — curated for diversity (segment, use case, recency), each
   attributed.
6. **Impact** — what solving it plausibly moves. Label the causal step
   **HYPOTHESIS**.
7. **Limitations** — recency, coverage, what to validate before GTM claims.

**Produce — the VoC artifact** (`ai-prd/prds/<slug>/stages/05-voice-of-customer.md`
inside a PRD run; a standalone `prd-evidence.md` otherwise), paste-ready: the
seven blocks above, every number tagged `[Feedback: …]`; plus a one-paragraph
slide blurb and a stakeholder-email version (additive to the four-part output
contract).

**Feeds:** `ai-prd/` stage 05 — this **is** the VoC artifact when connected data
exists — and stage 07 (rows into the Evidence Appendix); the Discovery Brief's
*What we know vs what we're assuming* table. If it returns nothing, that is the
stage-05 gap statement — logged, not papered over.
