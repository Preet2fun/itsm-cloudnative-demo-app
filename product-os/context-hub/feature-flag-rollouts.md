# Feature Flag Rollouts — dummy reference (SAMPLE, illustrative)

> **Dummy data — format demonstration only.** No real feature-flag system
> exists in the engineering repo (`platform-app`/`customer-app`) today — this
> file exists so `data-analysis/impact-estimation.md`'s `Users Affected` term
> has a real, concrete place to point at now, instead of a vague "the
> feature-flag / cohort table" phrase. Replace with a live query once a real
> flagging system is built and approved.

**As of:** 2026-09-30 (illustrative) · One row per tenant per flag.

| flag_key | description | tenant_id | tenant_tier | enabled | rollout_pct | updated_at |
|---|---|---|---|---|---|---|
| `ai_drafted_resolution_notes` | Auto-draft `resolution_notes` from the investigation trail (the §3.2 worked example) | `customer_a` | Tier 1 | true | 100 | 2026-09-01 |
| `ai_drafted_resolution_notes` | same | `customer_b` | Tier 1 | true | 100 | 2026-09-01 |
| `ai_drafted_resolution_notes` | same | `tenant_c` | Tier 2 | true | 50 | 2026-09-15 |
| `ai_drafted_resolution_notes` | same | `tenant_d` | Tier 2 | false | 0 | — |
| `ai_drafted_resolution_notes` | same | `tenant_e` | Tier 3 | false | 0 | — |
| `topology_graph_view` | Asset-service topology-graph UI (root `CLAUDE.md` §1's asset-service evolution) | `customer_a` | Tier 1 | true | 100 | 2026-08-20 |
| `topology_graph_view` | same | `tenant_c` | Tier 2 | false | 0 | — |

## How `impact-estimation.md` would use this

For a given `flag_key`, `Users Affected` = `COUNT(tenant_id WHERE enabled = true)`
— not the full ICP, not the full tenant base. Example, reading the table
above for `ai_drafted_resolution_notes`: **2 tenants fully enabled, 1 at 50%
rollout** — that's the real "Users Affected" input, not "however many
tenants exist."

## How to populate this for real

1. If a real feature-flag system gets built (see the open proposal in
   `../ai-pdlc-playbook.md`'s Discovery section — not yet approved/built),
   this file is replaced by a live query against that system's own store.
2. Until then: update this file by hand whenever a rollout actually changes,
   same discipline as the usage snapshot — don't let it go stale silently.
3. Tag any row that reflects a real decision (not illustration)
   `[Data: manual rollout log]` per `../ai-prd/citations.md`'s honesty rule,
   so a future reader can tell dummy rows from real ones.
