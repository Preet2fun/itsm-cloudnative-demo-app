# Lens 2 — Pattern Classification

**Purpose:** decide whether a specific request is worth a PRD, needs validation
first, or is one account's edge case.

**Question:** Is this one loud account, a segment need, or a whole-market gap?

**Inputs:** the request / theme in the customer's words; the data source;
`../../context-hub/icp.md` for the segment definitions.

**Do:**
1. Find every account raising this ask — semantic match, not keyword.
2. Compute reach — **% of all accounts** in the data, and the raw count.
3. Classify:

   | Class | Threshold | What it means |
   |---|---|---|
   | **Scalable product gap** | 10%+ of accounts | roadmap-worthy; a real discovery candidate |
   | **Segment-specific need** | concentrated in one tier / vertical | evaluate at the segment level; scope any PRD to that segment |
   | **Account-specific request** | rare across the market | validate before acting; likely a Park |

4. State what would change the classification (e.g. "3 more enterprise accounts
   → segment-specific").

**Produce:** the classification + reach numbers · which accounts / segments ·
2–4 quotes · what to validate · Limitations.

**Feeds:** `ai-discovery/` stage 02 lean and stage 06 decision — an
"account-specific" result is a Park signal; a "scalable gap" strengthens Pursue.
`[Feedback: …]` on the reach figure.
