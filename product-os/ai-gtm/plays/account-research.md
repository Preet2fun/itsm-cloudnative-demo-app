# Play — Account Research

**Purpose:** a complete intelligence brief on a target account before outreach.
Not a company summary — the specific **trigger** that makes now the right time,
and the **angle** to use.

**Run:** `Read gtm/plays/account-research.md and research <company.com>`

**Inputs:** account name + domain; [`../icp-tiers.md`](../icp-tiers.md) (fit);
[`../signal-library.md`](../signal-library.md) (active signals);
[`../battlecards/`](../battlecards/) (competitive context);
[`../personas/`](../personas/) (who to reach). Public sources: LinkedIn,
Crunchbase, BuiltWith, their blog / changelog / status page.

**Do:**
1. **Snapshot** — funding + months since last raise; headcount + growth; hires in
   the last 90 days (GTM, platform, security); recent product / infra moves;
   tech stack (monitoring, security, cloud).
2. **Stakeholder map** — 2–3 people per [`../personas/`](../personas/): name,
   title, time in role, recent public activity, best channel.
3. **Signal check** — for each Tier-1 / Tier-2 signal: present? when did it fire?
   score contribution (decay applied). Run the scoring model if not already done.
4. **Competitive context** — evidence of a fixed-7 competitor in the stack, job
   posts, or content; which battlecard applies; any evaluation signal.
5. **The angle** (this is the judgement part):
   - **Why now** — the datable event. If you can't name one, don't reach out.
   - **Why us** — the specific capability that maps to their situation now.
   - **The hook** — the first line. References something specific + an insight
     they'd actually want to read. Passes PVP.
   - **Who sends** — which stakeholder, which channel.

**Produce — `outputs/YYYY-MM-DD-research-<account>.md`:** snapshot · funding &
growth · tech stack (+ integration / displacement notes) · stakeholder table ·
active-signals table · competitive context · **the angle** (why now / why us /
hook / sender) · recommended next action (which sequence or play).

*Worked example:* [`../examples/2026-08-14-research-meridian-freight.md`](../examples/2026-08-14-research-meridian-freight.md)
(fictional).

**Gate:** "why now" is a datable event, not a generic assumption · ≥2
stakeholders with a reachable channel · signal score recorded · the hook makes
sense to someone who's never heard of Ockham · competitive context checked.
