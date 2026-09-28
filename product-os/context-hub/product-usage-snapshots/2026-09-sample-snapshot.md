# Product Usage Snapshot — 2026-09 (SAMPLE, illustrative)

> **Dummy data — format demonstration only.** No real telemetry pull behind
> any number in this file; no MCP product-analytics tool is connected for
> Ockham yet (see `../README.md`'s "Product usage data — two ways in"). This
> exists so the monthly-snapshot format is real and populatable, not so these
> specific numbers get cited anywhere as fact. Replace with a real pull once
> there's a connected tool or a real query run.

**Snapshot date:** 2026-09-30 · **Covers:** the trailing 90 days ·
**Source (when this becomes real):** `platform-app`/`customer-app` live
OTel/Prometheus metrics via `postgres`/`prometheus` MCP (root `CLAUDE.md`
§2), until a Method A tool is connected.

---

## Feature usage summary

| Feature / behavior | Metric | Value | Tag |
|---|---|---|---|
| Incident resolution notes | % of resolved incidents with `resolution_notes != ''` | 18% | `[Assumed — sample]` |
| Incident volume | Resolved incidents / tenant / month (median) | 34 | `[Assumed — sample]` |
| Asset search | % of active tenants using asset-service search weekly | 61% | `[Assumed — sample]` |
| Cache effectiveness | `itsm_cache_hits_total` / (`itsm_cache_hits_total` + `itsm_cache_misses_total`) | 74% | `[Assumed — sample]` |

## Adoption by tenant tier

| Tier | Tenants | Active (used ≥1 core feature this month) | Notes |
|---|---|---|---|
| Tier 1 (design partner) | 3 | 3 | — |
| Tier 2 | 9 | 7 | 2 dormant since onboarding |
| Tier 3 | 14 | 8 | Lowest engagement segment |

## Funnel — incident resolution flow (sample)

```
Incident opened        100%
  → Investigation started    88%
    → Root cause identified    64%
      → Resolution notes added  18%   ← the baseline `impact-estimation.md`'s
                                          resolution-notes worked example uses
```

## How to populate this for real

1. **If a Method A tool (Pendo/Amplitude/similar) is connected via MCP:**
   query it directly for the same shape of data above; cite it
   `[Data: <tool name>]` per `../../ai-prd/citations.md`'s honesty rule.
2. **Otherwise (today's reality):** run direct queries against
   `platform-app`/`customer-app`'s live Postgres/Prometheus via MCP — see
   `../../ai-pdlc-playbook.md` §3.8 for the exact query pattern used for the
   resolution-notes example. Tag every number `[Data: …]`, never leave a
   real pull looking like this sample's `[Assumed — sample]` tag.
3. File the next month's snapshot as a new dated file
   (`product-usage-snapshots/<YYYY-MM>.md`) — don't overwrite this one;
   trend-over-time is part of the value.
