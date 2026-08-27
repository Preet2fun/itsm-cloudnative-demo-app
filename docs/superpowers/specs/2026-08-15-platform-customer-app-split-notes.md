# Platform App / Customer App Split — Discussion Notes

Status: **raw discussion notes, not a design doc yet.** Nothing here is
approved or final. Purpose: capture the conversation as it happens so we can
review it as a whole later and then plan execution step by step. No
implementation, no code, no infra changes have been made from this thread.

This supersedes the framing (not necessarily the technical content) of
`docs/superpowers/specs/2026-08-13-fusion-ai-platform-revamp-design.md`,
which tried to fuse everything into one app and became hard to reason about.

---

## 1. Why this reset

The original fusion design (2026-08-13) tried to build ITSM + observability +
security + AI reasoning all inside one app (Synap). It got too complex to
hold in your head and maintain. Decision: split into two separate apps with
a clear boundary — one thing is *observed*, the other *does the observing*.

## 2. The two-app split

- **Platform App** — this existing repo (`itsm-cloudnative-demo-app` / Synap:
  user-service identity engine, asset-service, incident-service, frontend,
  K8s/Istio/OPA setup), **revamped**. This is the actual product / business
  driver: an observability + security platform, AI-agent-driven.
- **Customer App** — a **brand-new, separate** multi-tenant demo app, not
  built yet. Simulates different tenants generating realistic activity. Will
  be described by the user in a future session/message. Out of scope for
  now — nothing to decide about it yet beyond "it exists and Platform App
  observes it."

Platform App observes Customer App (which is itself multi-tenant) from the
outside. Confirmed: existing repo's identity/K8s/Istio/OPA/Postgres
infrastructure is reused as Platform App's own infra, not discarded.

## 3. What happens to the existing ITSM domain logic

Both existing services are **repurposed**, not discarded, into Platform App:

- **incident-service → "Incident" tab.** Becomes the history of incidents
  *investigated by AI agents* — not manually-created tickets. Every
  investigated incident's RCA / resolution knowledge feeds the agent's
  memory for future cases (i.e. this is the operational surface of the
  Episode/Fact memory-graph concept from §8.4 of the 2026-08-13 doc — same
  idea, now correctly scoped as Platform App's own feature rather than
  something bolted onto ITSM).
- **asset-service → topology graph key source.** No longer CRUD ticketing
  target; its job becomes producing unique asset keys used to build the
  topology graph (same idea as §8.3's deterministic `node_key` in the
  2026-08-13 doc).

## 4. Incident tab — UI reference (screenshot provided 2026-08-15)

User attached a reference screenshot of an alert/investigation thread
console. Shape observed:

- **Left rail filters:** time range, sort (last activity), thread read
  state, severity (P0 Critical … P4 Info, each with a count), status
  (Investigating / Awaiting approval / Needs response / Resolved / Silenced
  / Failed).
- **Main list ("Thread Detail"):** one row per incident/investigation thread
  — severity chip, title (e.g. "K8s Pod Startup Failure Alert"), short
  description referencing the implicated resource (e.g. "False-positive
  New Service (v1env)...").
- **"Human Actions" column has two distinct categories** (new information,
  not fully captured in the 2026-08-13 doc's L1-autonomy model):
  1. **Needs Approval** — agent-proposed actions (e.g. "Merge PR #301",
     "Search K8s events for `newsvc` warnings") gated by Approve/Deny. This
     matches the existing L1 (recommend, human-approves) autonomy model.
  2. **"You own these"** — raw commands (e.g.
     `kubectl get deploy newsvc -n v1env -o yaml`) assigned directly to a
     human, apparently *not* routed through agent proposal/approval at all.
     **Open question, not yet answered:** how this human-owned action
     category differs from / relates to the agent-proposed approval flow —
     revisit when we get to the action/approval data model.
- **Status column:** e.g. "Resolved" with a check icon.
- **Channel column:** partially visible in the screenshot, likely tied to
  notification delivery (Slack-style channel per thread) — relevant to
  `notification-service`, which was flagged as a still-a-stub, critical-path
  item in §14 of the 2026-08-13 doc.

## 5. Open items parked for later (explicitly not decided yet)

- The "You own these" vs. "Needs Approval" action distinction (§4 above).
- Whether Platform App keeps its own schema-per-tenant Postgres pattern
  (`tenant_a`, `tenant_b`, ...), now keyed to Customer App's tenants, or
  whether tenancy is modeled differently now that ITSM SaaS multi-tenancy
  itself moves to the new Customer App.
- Fate of the existing frontend Sprint 0–1 (email/password login + OTP MFA)
  — presumably becomes Platform App's own operator/SRE login, not yet
  explicitly confirmed by the user.
- How Customer App will structurally connect to / feed signals into
  Platform App (separate repo? separate cluster or same cluster? push vs.
  pull telemetry?) — deferred until the user introduces Customer App.
- How much of the 2026-08-13 fusion doc's technical architecture (§5 Signal
  Spine, §6 hybrid Memgraph+Postgres graph store, §8.2 `SynapSignal`
  contract, §8.6 agent runtime state machine) carries over as-is to Platform
  App vs. needs rework now that it's a standalone app instead of fused into
  Synap's own services. Likely carries over largely unchanged in substance,
  just re-scoped — to be confirmed once we start planning.

## 6. Three-project structure for roadmap/task tracking

The demo is one end-to-end thing (a multi-tenant observability & security
platform demo) but the user wants the roadmap and every task tagged to
exactly one of **three** projects, tracked in GitHub as three project
boards/lanes:

1. **Customer App** — the multi-tenant demo app being observed (§2).
2. **Platform App** — this existing repo, revamped: identity/K8s/Istio/OPA
   infra, the "Incident" tab (§3), asset/topology graph keys (§3), UI shell.
3. **AI Engine** — the agent reasoning core (signal ingestion, graph store,
   agent runtime/state machine, evidence ledger, memory — the substance of
   §5–§8 in the 2026-08-13 fusion doc). **Functionally this is part of
   Platform App** (it's what the platform runs on), but the user wants it
   developed and tracked as its **own separate project**, explicitly
   because this is the differentiated core — "the moat" — of the whole
   demo, not because it deploys or runs independently of Platform App.

Open, not yet answered: whether "separate project" means a separate git
repo/codebase, a separate directory boundary within this repo, or purely a
separate GitHub Projects tracking lane over code that still lives alongside
Platform App. Not clarified yet — revisit when we get to repo/codebase
layout.

## 7. Repo structure executed (2026-08-15)

User moved from "just capture notes" to "let's execute the folder split now."
Result — three top-level folders now exist:

```
customer-app/     empty stub (README only) — not built yet
platform-app/     services/{user,asset,incident,notification}-service,
                   frontend, infra/, database/, policies/,
                   design_handoff_synap/, docs/{platform,product}, most
                   scripts/, tests/
ai-engine/         services/ai-service (was an empty stub, now the AI
                   Engine's home), design/ (was ai-platform-design/),
                   research/ (extracted from the agentic-ai-hub gitlink)
```

Also done as part of this pass:
- Removed the merged-and-stale `.claude/worktrees/sprint-1-auth-mfa` git
  worktree (`git worktree remove`) — Sprint 1/PR #26 was already merged.
- `agentic-ai-hub/agentic-ai-hub` (the accidental gitlink flagged in §4 of
  the 2026-08-13 doc) — resolved by extracting its two research docs into
  `ai-engine/research/` as plain files and dropping the gitlink entirely
  (`git rm --cached`, since it was never a real registered submodule).
- Updated `.github/workflows/{ci-build,ci-lint,ci-docker-push}.yml` — all
  `services/<name>` paths changed to `platform-app/services/<name>` so CI
  doesn't silently break next run.
- Removed stray untracked `.DS_Store` files (were never git-tracked, pure
  filesystem junk).

Left at repo root, deliberately untouched: `README.md`, `LICENSE`,
`CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md` (GitHub reads these
from root only), `ROADMAP.md`, `SYSTEM_PROMPT.md`, `VERSIONS.md`,
`master-prompt-draft.md` (cross-cutting meta docs — content still reflects
the old single-app framing and needs a rewrite pass, but that's separate
from the physical move), `scripts/populate-roadmap.sh` +
`scripts/setup-github-project.sh` (manage the GitHub Projects tracking
across all three sub-projects per §6, so kept repo-wide rather than under
platform-app), and `docs/superpowers/specs/*` (design-discussion history,
including this file).

**Not yet done, flagged not fixed:** `.claude/CLAUDE.md` still describes the
old single-app structure (paths like `services/user-service`,
`infra/helm/itsm-app`) and will read as wrong/stale until it's rewritten for
the three-project split — a content task, not attempted in this pass.
Nothing has been committed to git — changes are staged/unstaged in the
working tree for the user to review and commit.

## 9a. Pre-existing security findings (surfaced 2026-08-15, not fixed)

An automated background security review flagged two HIGH findings in code
carried over unchanged by the §7 move (pure `git mv`, no content edited —
these predate this session):

1. **`platform-app/services/user-service/internal/handlers/users.go` —
   `InternalGetByID`.** Service-to-service endpoint
   (`GET /internal/users/{id}?tenant_slug=...`) takes `tenant_slug` from a
   client-controlled query param instead of a verified source, and has no
   `X-Tenant-ID` middleware — comment claims "protected by Istio mTLS,"
   but mTLS authenticates the transport, not the caller's authorization.
   Net effect: any caller reaching this endpoint can look up any user in
   any tenant.
2. **`platform-app/infra/k8s/opa/policy-configmap.yaml`** — the "public"
   path rule is a negative match, `public if { not startswith(path,
   "/api/v1/") }`. Because `/internal/*` doesn't start with `/api/v1/`, it
   falls through as "public" under OPA too — compounding finding 1: the
   internal endpoint isn't gated by OPA RBAC either, only by the
   insufficient mTLS assumption above.

Not fixed — flagged only, pending the user's call on when to address it
(pre-existing debt, unrelated to the customer/platform/AI-engine split
itself, but worth fixing before Platform App's Incident-tab work leans on
`user-service` further).

## 7a. Customer App domain (2026-08-15)

First concrete details on Customer App, given after the repo split (§7) was
executed:

- **Domain: a simple e-commerce food-delivery app.** This is the actual
  business shape of the "thing being observed" — not decided until now.
- **4–5 microservices, one of which is a cache service.** Specific service
  breakdown not yet given.
- **Deliberately polyglot: Python, Go, and Java** across the services —
  explicit reason given: diversify the telemetry data shape so the
  observability setup has to handle multiple language runtimes/OTel SDKs,
  not just one. Which service gets which language not yet assigned.
- **Database: reuses the already-existing PostgreSQL instance** (the same
  live external Postgres this repo's services already use, per
  `[[project_database_url]]` memory) — not a new database server. Exact
  granularity (new DB on that server vs. new schemas in the existing `itsm`
  DB vs. literally the existing tenant schemas) not yet specified.
- **Telemetry lands in Platform App's observability stack, not a separate
  one** — Customer App's OTel signals get tagged differently (not yet
  specified how — resource attribute? label?) so Platform App's AI agents
  can query tenant-wise, keeping data segregated despite sharing the
  backend.

Confirms and answers one item from §5's open-items list: Platform App does
keep a shared backend (DB + observability stack) that Customer App's tenant
data flows into, tagged for segregation — rather than Customer App having
fully separate infra.

**Resolved (2026-08-15, answered via quick multiple-choice check-ins):**
- **Tenant model:** each tenant is a separate branded deployment of the
  food-delivery app itself (tenant_a = one operator, tenant_b = another) —
  mirrors Platform App's existing SaaS-tenant pattern exactly, reuses
  schema-per-tenant as-is, zero new isolation logic needed.
- **DB granularity:** same Postgres server/instance as Platform App, but
  Customer App gets its **own set of tenant schemas** (not literally
  Platform App's existing `tenant_a`/`tenant_b`/`tenant_c`) — keeps
  food-delivery tables (orders, restaurants, riders, ...) from mixing into
  the same schema as Platform App's tables (users, incidents, assets).
  Naming convention for these new schemas not yet decided.

**Still open, not yet answered:**
- Hardware budget: CLAUDE.md's cluster is 3 nodes / 16GB total, ~10–11Gi
  usable workload RAM, HPA max=2 everywhere. That budget already has to
  fit Platform App + AI Engine (~1.28Gi incremental estimate from the
  2026-08-13 doc, unverified live). Adding a second polyglot,
  multi-service app (4–5 more services, some doubled by HPA) on the *same*
  cluster needs an explicit resource-budget pass — not yet done.
- ~~What the 4-5 services actually are~~ — **resolved (2026-08-15), final
  list:**
  - `order-service` — Go
  - `catalog-service` — Python
  - `delivery-service` — Java
  - `payment-service` — Java
  - cache — Redis
  4 app services + cache = 5, matching the "4-5" range. Two of five app
  services are on the JVM.
- **JVM memory risk, raised with user (2026-08-15) — decision: defer.** The
  CLAUDE.md resource-limit table (§4) was sized for Go/Python only (e.g.
  128Mi/256Mi for asset/incident services), no precedent for a JVM service
  (typically 256–512Mi baseline before app logic, 2-4x the Go/Python rows).
  User's call: **note it, don't size it now** — do the actual
  resource-budget math for `delivery-service`/`payment-service` (and
  whether the cluster still holds Platform App + AI Engine + Customer App
  together) at implementation-planning time, not during this discussion
  pass. Explicitly not choosing a lightweight-JVM-framework mitigation
  (Quarkus/Micronaut) at this stage either — left open.

## 7b. Governing principle for Customer App scope (2026-08-15)

User course-corrected explicitly: **keep Customer App as simple as
possible — the one non-negotiable requirement is that it's multi-tenant,
nothing more.** Not a fully-featured food-delivery product; its job is to
be a realistic-but-minimal signal generator for Platform App to observe.
Applies retroactively as a lens on everything in §7a: 5 services (order/
catalog/delivery/payment/cache) is already the intended ceiling, not a
starting point to grow from — resist adding features, extra services, or
architectural sophistication (sagas, event sourcing, elaborate domain
modeling, etc.) beyond what's needed to (a) prove multi-tenant isolation
end-to-end and (b) generate believable telemetry across 3 languages. This
also colors the deferred JVM-sizing question in §7a — likely resolves
toward "keep it minimal" rather than adding framework complexity.

## 7c. Customer App DB schema (2026-08-15)

No postgres MCP was actually available in this environment (despite
CLAUDE.md referencing one) — read the existing migration files directly
instead, which is the definitive source anyway.

Mirrored `platform-app/database/migrations`' exact pattern
(`public.tenants` registry + `create_tenant_schema(slug)` function) for
Customer App, kept as a fully separate registry:

- `customer-app/database/migrations/000001_init_customer_registry.up.sql` —
  `public.customer_tenants` (separate table from Platform App's
  `public.tenants`, same shape).
- `000002_customer_tenant_schema_function.up.sql` —
  `public.create_customer_tenant_schema(slug)`, builds a schema per tenant
  with 5 tables, one owned per service: `restaurants`+`menu_items`
  (catalog-service), `orders` (order-service), `deliveries`
  (delivery-service), `payments` (payment-service). Intra-schema FKs from
  orders→restaurants, deliveries/payments→orders — mirrors the existing
  precedent of `incidents.related_asset` referencing `assets(id)` across
  service-owned tables in the same schema.
- **Tenant slug convention:** `customer_a`, `customer_b`, `customer_c`, ...
  — visually distinct from Platform App's bare `tenant_a` in any schema
  listing. The function uses the slug directly as the schema name, same as
  Platform App's `create_tenant_schema`.

**New flag for later (not addressed now):** if Customer App's migrations
run via `golang-migrate`/similar against the *same* Postgres database as
Platform App using default settings, both would fight over the same
`schema_migrations` tracking table. Needs a distinct tracking-table name
(e.g. `-x-migrations-table=customer_app_schema_migrations`) when the actual
migrate command gets wired up — not done yet, just flagged so it isn't
discovered the hard way later.

## 7d. order-service built (2026-08-15)

`customer-app/services/order-service/` — full Go implementation (Chi v5,
pgx/v5, OTel), not just scaffolding. Mirrors `user-service`'s conventions
exactly (search_path-per-request via `X-Tenant-ID`, no JWT handling — that's
Istio's job once Customer App is meshed). `go build`, `gofmt`, `go vet` all
clean.

Resolves an open item from §7a: telemetry segregation tag is the OTel
semantic-convention resource attribute `service.namespace=customer-app`,
set in `telemetry/telemetry.go` — standard OTel mechanism rather than a
custom label, so Platform App's collector/agents can filter on it without
bespoke parsing.

Endpoints: `GET/POST /api/v1/orders`, `GET /api/v1/orders/{id}`,
`PUT /api/v1/orders/{id}/status` (status transitions only — no full edit,
per "as simple as possible").

## 8. Process note

User explicitly asked to pause here: no design proposal, no approach
comparison, no implementation — just keep listening and capturing notes as
the user continues walking through the full picture. We'll review this
whole document together once the picture is complete, then move to planning
execution step by step.
