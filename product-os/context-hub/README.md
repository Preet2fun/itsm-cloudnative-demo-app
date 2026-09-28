# Context Hub

The upstream source of truth for Ockham: **company context** — who the company
is and what it believes. Every Product OS folder and every lifecycle phase reads
from here. When a downstream doc disagrees, this wins or is updated on purpose.

Scope: company identity, positioning, market, ICP, competitive landscape, the
agentic use-case set, and the technical theses that define the product's angle.
It is **not** where shipped-feature documentation lives — that is the
[Knowledge Hub](../knowledge-hub/).

> Was `product-os/company-context/`; renamed to `product-os/context-hub/` on
> 2026-09-04.

## Contents

| File | What it holds | State |
|---|---|---|
| [`company-brief.md`](company-brief.md) | Company + product identity, the Occam's Razor thesis, AI-native vs "AI-powered", category, vision, security arc, proof points | Seeded |
| [`positioning.md`](positioning.md) | Draft positioning statement, the wedge, core pitches per buyer persona, proof-chains / anti-hallucination line, runbook close, metric rules | Seeded |
| [`icp.md`](icp.md) | Ideal customer profile — firmographic, technographic, organizational, behavioural triggers, disqualifiers | Seeded |
| [`competitive-landscape.md`](competitive-landscape.md) | The fixed 7-competitor reference set (ops + security), with what to study each for, plus captured reference notes | Seeded |
| [`agentic-use-cases.md`](agentic-use-cases.md) | What the AI layer performs — Ops/SRE and AI-SOC use-case tables with shipping precedents, plus the moat line | Seeded |
| [`ebpf-signal-thesis.md`](ebpf-signal-thesis.md) | How eBPF runtime signals drive dynamic vuln / posture / identity prioritization, and the one-sensor structural advantage | Seeded |

**Seeded** = captured from the founder's initial context dump (2026-09-04),
intent preserved. These are living documents; refine as the product sharpens.

## Product usage data — two ways in

Context Hub's scope isn't only company/market context — it also holds **live
product behavior**: feature usage, funnels, adoption, once the product is
live. Same two-ways-in pattern `../ai-feedback/` already uses for customer
feedback, applied to product-usage data instead:

| Method | When | How |
|---|---|---|
| **A — MCP-connected product-analytics tool** (Pendo, Amplitude, Mixpanel, etc.) | A tool is wired to Claude via MCP | Query it directly for live funnels/usage/adoption — best coverage, always current. Context Hub holds a **pointer** to the connection (which tool, what it tracks) — never the raw data itself; the tool stays the source of truth. |
| **B — Monthly snapshot file** | No MCP tool connected (today's reality — Ockham has no product-analytics tool wired up yet) | A dated markdown snapshot lands in [`product-usage-snapshots/`](product-usage-snapshots/), one file per month, summarizing feature usage/adoption/funnels as of that date |

**State today:** Method A — nothing connected. Method B — one **dummy,
clearly-marked illustrative** snapshot exists
([`product-usage-snapshots/2026-09-sample-snapshot.md`](product-usage-snapshots/2026-09-sample-snapshot.md))
so the format exists and can be populated for real once there's real usage
data to summarize. The nearest real source today is `platform-app`'s and
`customer-app`'s live OTel/Prometheus metrics (root `CLAUDE.md` §5) — see the
worked example in [`../ai-pdlc-playbook.md`](../ai-pdlc-playbook.md) §3.7–3.8
for exactly how to pull a real number from them.

**Feeds:** `data-analysis/impact-estimation.md`'s `Current Action Rate` term
(see its "Ockham source" column); `ai-launch-strategy.md`'s Customer
Retention factor once real usage exists.

## Feature-flag rollout data — a placeholder, until a real system exists

No feature-flag/cohort-tracking system exists in the engineering repo today
— so `data-analysis/impact-estimation.md`'s `Users Affected` term (which
tenants a rollout actually reached, not the full ICP) has nowhere real to
read from either. Same dummy-file pattern as the usage snapshot above:
[`feature-flag-rollouts.md`](feature-flag-rollouts.md) holds illustrative
per-tenant rollout state (flag key, tenant, enabled, rollout %), clearly
marked dummy, updated by hand until a real flagging system is built (a real
build is proposed but **not yet approved** — see
[`../ai-pdlc-playbook.md`](../ai-pdlc-playbook.md)'s Discovery section).

## Discovery questions this hub answers

The **Business Value Map** of the discovery worksheet (Product Faculty AI PRD
template / 4D "Discover") is answered here **once**, not per feature. `ai-discovery/`
reads it instead of re-asking:

| Discovery question | Answered in |
|---|---|
| What industry / market? Headwinds, tailwinds, key competitors? | `company-brief.md`, `competitive-landscape.md` |
| Projected market growth (3–5 yr)? | `../data-analysis/` (when populated) |
| Growth stage · revenue model · B2B / B2C / B2B2C? | `company-brief.md` |
| Key differentiators? | `positioning.md` |
| Who are the customers / buyers? Who are the end users? | `icp.md` |
