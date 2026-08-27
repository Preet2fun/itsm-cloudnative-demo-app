# Identity & Tenancy Consolidation — Design

Status: **approved design, ready for implementation planning.** Produced via
the brainstorming process (architectural path) from a conversation on
2026-08-27. Supersedes the open tenancy question left in
`docs/superpowers/specs/2026-08-15-platform-customer-app-split-notes.md` §5
("Whether Platform App keeps its own schema-per-tenant Postgres pattern...").

---

## 1. Background — the full vision this sits inside

This is sub-project 1 of a larger reset, captured across a live conversation
on 2026-08-27 (not written up elsewhere until now). Full picture, for
context:

- **Three projects share one K8s cluster + one Postgres instance via Helm:**
  `customer-app` (customer-facing, multi-tenant food-delivery demo),
  `platform-app` (this repo's existing ITSM/observability/security product —
  ai-engine is functionally part of it), and `ai-engine` (tracked separately
  per `2026-07-08-platform-product-split-design.md`).
- **Auth is unified, not duplicated.** Customer App has no identity engine of
  its own — it authenticates against Platform App's existing `user-service`.
  This is the reverse of what `2026-08-15-platform-customer-app-split-notes.md`
  §5 left open ("How Customer App will structurally connect... token
  issuance? separate repo?") — the answer is: same identity engine, no new
  auth system.
- **Tenancy is unified too.** Platform App's *own* pre-existing tenant concept
  (`public.tenants`, `tenant_a`/`tenant_b`/`tenant_c` — built in P-Phase 2/3,
  before Customer App existed) is retired. Customer App's tenant registry
  (`public.customer_tenants`, `customer_a`/`customer_b`/`customer_c`) becomes
  the **one** canonical tenant identity for the whole system.
- **Two populations of user, one shared identity table:** Customer App's
  tenant-scoped end-users (people ordering food, one tenant each) and
  Platform App's own cross-tenant staff (people doing observability/
  security/RCA analysis, not scoped to any single tenant) are stored in the
  *same* `users` table, distinguished by whether `tenant_id` is set.
- **Telemetry is tenant-tagged at the signal level**, not just the
  resource/service level, so Platform App's Incident tab / AI Engine can
  attribute an RCA investigation to a specific tenant
  (`span.set_attribute("tenant.id", ...)`, per CLAUDE.md §5's existing
  convention). Order-service and catalog-service already do this;
  delivery-service and payment-service (Java, auto-instrumentation-only
  today) do not yet — tracked as sub-project 2, not this one.
- **Both apps get their own UI**, both already designed via Claude Design
  (Customer App's UI is sub-project 3, Platform App's is sub-project 4 —
  the latter needs reconciling with the existing Sprint 0/1 login+MFA build).
- `CLAUDE.md` gets rewritten to reflect all of this (sub-project 5), **last**,
  once the above is actually built — not before.

## 2. Scope of this spec

**In scope:** making login and tenant identity work correctly for both
populations described above — the data model, `user-service`'s login/JWT
logic, and the frontend login screen.

**Out of scope (explicitly, deferred elsewhere):**
- Tenant-scoped telemetry tagging for delivery-service/payment-service
  (sub-project 2).
- Customer App's own UI and Platform App's own UI (sub-projects 3/4).
- **Cross-tenant data *browsing* by platform staff** — e.g. a platform
  analyst picking "show me `customer_a`'s incidents" in some future Incident
  tab screen. Istio can't inject `X-Tenant-ID` from a JWT claim that doesn't
  exist (platform staff have none), so *browsing* a specific tenant's data
  needs its own selector mechanism. That's tied to whichever screen needs it
  and belongs with sub-project 4, not here. This spec only makes
  **authentication** work for platform staff, not cross-tenant querying.
- Customer App end-user self-signup — seed-provisioned only, for this demo.
- Migrating/preserving old `tenant_a`/`tenant_b`/`tenant_c` data — it's being
  retired, not carried forward. Clean reseed only.
- `CLAUDE.md` rewrite (sub-project 5).

## 3. Current state (verified, not assumed)

Read directly from `platform-app/database/migrations/` and
`platform-app/services/user-service/` before writing this design:

- `public.tenants(id, name, slug UNIQUE, created_at, is_active)` +
  `create_tenant_schema(slug)` builds `<slug>.users(id, email, password_hash,
  full_name, role CHECK IN admin/agent/viewer, is_active, created_at,
  updated_at)` with `UNIQUE(email)` **scoped per schema**, plus `<slug>.assets`
  and `<slug>.incidents`/`<slug>.incident_events`, both FK'ing `<slug>.users`
  (`assigned_to`, `actor_id`).
- **Login requires the tenant slug up front, today.** `LoginRequest{Email,
  Password, TenantSlug}` → `Repo.FindByEmail(ctx, slug, email)` → every
  `Repo` method does `SetTenantPath(ctx, conn, slug)` then an unqualified
  `SELECT ... FROM users`, relying entirely on Postgres `search_path`. There
  is no cross-schema email lookup anywhere — mechanically, you cannot log in
  without already knowing your tenant.
- JWT's `tenant_id` claim is copied straight from the login request's
  `TenantSlug` — not read from any column on the user row.
- `role` is enforced by both a Postgres `CHECK` and a Go `validRole()`.
- `InternalGetByID` (`internal/handlers/users.go`) takes `tenant_slug` from
  an unauthenticated query param — the pre-existing HIGH finding from the
  2026-08-15 notes §9a, not yet fixed.
- Every other `UserHandler` method threads `slug` from
  `middleware.GetTenantID(ctx)` into the same per-schema `Repo` calls.
- `platform-app/services/frontend/.../Login.tsx` has three fields, not two:
  a **"Workspace" text input bound to `tenantSlug`**, defaulting to
  `'tenant_a'`, plus email and password.
- `asset-service`/`incident-service` (Python) are already fully
  schema-agnostic, driven entirely by the `X-Tenant-ID` header at request
  time — zero hardcoded `tenant_a/b/c` references. **Unaffected by this
  change.**
- Istio's `RequestAuthentication` (`itsm-jwt-auth`) maps the JWT's
  `tenant_id` claim → `X-Tenant-ID` header and `role` claim → `X-User-Role`
  header via `outputClaimToHeaders`. Confirmed via Istio's own reference
  docs: *"The header will not be there if the claim does not exist."* — so a
  platform-staff token with no `tenant_id` claim simply results in no
  `X-Tenant-ID` header being injected. No error, no special config needed.
  **This config requires no changes for this design to work.**

## 4. Design

### 4.1 Data model

**Revised after plan-time review (see §7):** this is now a purely *additive*
change. `tenant_a`/`tenant_b`/`tenant_c` schemas, `public.tenants`,
`create_tenant_schema`, and their `assets`/`incidents`/`incident_events`
tables are **left completely untouched** — not dropped, not migrated. Their
FKs to the old per-schema `users` table stay exactly as they are, since
nothing referencing them is being deleted. Those schemas simply stop being
used for login going forward; where Platform App's own `assets`/`incidents`
eventually relate to Customer App's `customer_a/b/c` tenants is an explicit
open question for a later pass (§7), not this one.

A brand-new `public.users` table is created, with no FK relationship to
`assets`/`incidents` (there wasn't one before either — those FK'd the old
per-schema `users`, not anything in `public`):

```
public.users(
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,      -- was UNIQUE per-schema; now global
  password_hash TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL CHECK (role IN (
                    'admin','agent','viewer',           -- existing, unchanged meaning
                    'platform_admin','platform_analyst'  -- new: cross-tenant staff
                )),
  tenant_id     TEXT NULL,  -- no DB-level FK, see below
                -- NULL = platform staff, cross-tenant.
                -- set   = scoped to that Customer App tenant (a
                --         public.customer_tenants.slug value, validated
                --         at the application level).
  is_active     BOOL NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
```

**Deliberately no hard FK** to `customer-app`'s `public.customer_tenants.slug`
— see open question in §6. `tenant_id` is a plain `TEXT` column validated at
the application level, specifically to avoid coupling `platform-app`'s and
`customer-app`'s independent migration sets by deploy order (each has its
own `run-migrations.sh` and tracking table; `customer-app`'s isn't
guaranteed to have run first).

`assets.assigned_to`, `incidents.assigned_to`, `incident_events.actor_id`
are **left exactly as they are** — still `REFERENCES tenant_a.users(id)`
etc. Nothing is being dropped, so there is nothing to repoint.

Delivered as a **new** migration (`000006_create_shared_users.up.sql`), not
an edit to migrations that have already run elsewhere — `golang-migrate`
tracks applied migrations by number; editing historical files breaks that
tracking. This migration does exactly one thing: `CREATE TABLE
public.users` as above. Down-migration: `DROP TABLE public.users`.

### 4.2 `user-service`

- `Repo`'s method signatures drop the mandatory `slug` parameter for
  lookups that should now be global: `FindByEmail(ctx, email)` instead of
  `FindByEmail(ctx, slug, email)`. Tenant-scoped writes (e.g. provisioning a
  new Customer App end-user for a specific tenant) still take a `tenant_id`
  argument — it's just no longer used to pick a Postgres schema via
  `search_path`, it's a plain column value on the insert.
- `LoginRequest` drops `TenantSlug` — login becomes `{Email, Password}` only.
- JWT issuance (`issueToken`) reads `tenant_id` off the authenticated user
  row, not off anything the caller supplied. If `NULL`, the claim is omitted
  from the token entirely (not set to an empty string) — confirmed safe per
  §3's Istio behavior.
- `InternalGetByID` gets a real fix in the same pass, since this file is
  already being touched: restrict to trusted service-account callers via an
  Istio `AuthorizationPolicy` (SPIFFE peer-principal allowlist), per the
  original 2026-08-15 finding's own suggested fix, rather than the current
  "protected by mTLS" comment that doesn't actually authorize anything.
- **`middleware.TenantRequired` changes** (`internal/middleware/headers.go`):
  today it 400s whenever `X-Tenant-ID` is absent. Under this design, a
  platform-staff caller's request legitimately has *no* `X-Tenant-ID` at all
  (§3's confirmed Istio behavior) — so absence must become valid, not an
  error. Only a *malformed* (present-but-invalid) header stays a 400. The
  context value stored for an absent header is `""`.
- **Finalized `UserHandler` behavior** for a shared table (was left open in
  the brainstorming pass, decided now): "platform staff manage platform
  staff; tenant-scoped admins manage their own tenant's users."
  - `List`: caller's tenant context `""` (platform) → `Repo.List` filters
    `WHERE tenant_id IS NULL`. Non-empty → filters `WHERE tenant_id = $1`.
  - `Create`: the new user's `tenant_id` is always the *caller's own*
    context value (platform caller → new user also has `tenant_id = NULL`;
    tenant-scoped admin → new user gets that same tenant). A caller can
    never create a user in a different tenant than their own through this
    endpoint.
  - `GetByID` / `Update` / `Delete` / `ChangePassword`: **new IDOR guard**,
    a direct consequence of moving off per-schema isolation (there is no
    longer a `search_path` accident-proofing this). After `Repo.FindByID`,
    compare the target row's `tenant_id` against the caller's context
    value; platform callers (`""`) may act on any user, tenant-scoped
    callers only on users whose `tenant_id` matches their own. Mismatch →
    `404` (not `403`, to avoid confirming the ID exists in another tenant).

### 4.3 Istio

No changes. §3 confirms the existing `RequestAuthentication` already does
the right thing for an absent `tenant_id` claim.

### 4.4 Frontend (`platform-app/services/frontend`)

Remove the "Workspace" (`tenantSlug`) field from `Login.tsx` entirely; the
login form becomes email + password. The submitted request body drops
`tenant_slug`.

### 4.5 Seed data

Purely additive, matching §4.1's revision — nothing in `tenant_a/b/c` is
touched or removed:
- Insert `alice.admin@globaltech.io` (the existing live-tested credential,
  same password hash/value `Password1!`) into `public.users` with
  `tenant_id = NULL`, `role = 'platform_admin'` — same person, same
  password, new table. Her old row in `tenant_a.users` is left alone
  (harmless, unused going forward, no email conflict since it's a separate
  table with its own unique index).
- No other seed rows added — out of scope beyond keeping existing
  MFA-flow tests working.
- Customer App's existing `customer_a`/`b`/`c` seed data (restaurants/orders/
  etc.) is unaffected — this spec only touches identity, not Customer App's
  own tenant-schema tables.

### 4.6 Testing

- `user-service`'s existing tests reference tenant-slug login flows — these
  need updating to the new email-only login shape, not just supplementing.
- New coverage: login with a `tenant_id`-scoped user returns a JWT with that
  claim set; login with a platform-staff (`tenant_id = NULL`) user returns a
  JWT with the claim omitted; `InternalGetByID`'s authorization fix gets its
  own test (this doubles as closing out the 2026-08-15 finding).
- `asset-service`/`incident-service` need no test changes — confirmed
  unaffected in §3.

## 5. Error handling / edge cases

- **Email uniqueness is now global, not per-tenant.** Previously each
  tenant schema had its own `UNIQUE(email)`, so the same email could exist
  in `tenant_a` and `tenant_b` independently. Under the shared table, two
  different Customer App tenants' customers cannot share an email. This is
  an intentional behavior change (more realistic for a real system, and
  consistent with "one identity table") — called out explicitly so it isn't
  discovered as a surprise later.
- A `tenant_id` value must reference an existing `customer_tenants.slug` at
  the application level (no DB FK, per §4.1) — `user-service`'s
  create/update paths should validate this against `customer-app`'s
  registry, not just trust the caller.

## 6. Open questions carried forward

- Whether to eventually add the DB-level FK from `public.users.tenant_id` to
  `customer-app`'s `public.customer_tenants.slug` once both migration sets
  are known to run in a fixed order (e.g. once there's real deployment
  automation in P-Phase 7/9's ArgoCD work) — deferred, not blocking this
  implementation.
- **Where Platform App's own `assets`/`incidents`/`incident_events` end up
  relative to `customer_a/b/c`** — see §7. Explicitly not decided or
  attempted here.

## 7. Plan-time revision (2026-08-27)

While writing the implementation plan for this spec, reading
`create_tenant_schema()` closely surfaced something this spec's first draft
missed: `assets`, `incidents`, and `incident_events` live *inside the same*
`tenant_a`/`tenant_b`/`tenant_c` schemas as the old `users` table — not
somewhere separate. §4.1's original wording ("drop the `tenant_a/b/c`
schemas entirely") would have silently deleted them.

Raised with the user before writing any migration. Decision: **do not touch
`tenant_a`/`tenant_b`/`tenant_c` at all.** This spec is revised throughout
(§4.1, §4.5) to be purely additive — a new `public.users` table, nothing
dropped, nothing repointed. `assets`/`incidents` stay exactly where they
are, using the old per-schema `users` table as before, now fully
disconnected from the login/identity system this spec builds. Where they
*should* eventually live relative to `customer_a/b/c` (see §3 of the
2026-08-15 split notes — "asset-service → topology graph key source",
"incident-service → Incident tab") is real, not-yet-designed follow-up work,
likely paired with sub-project 4 (Platform App UI) rather than a standalone
piece — deliberately left as an open question, not guessed at here.
