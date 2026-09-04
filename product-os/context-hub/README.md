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
