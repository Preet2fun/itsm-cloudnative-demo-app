# Customer App

A brand-new, separate multi-tenant demo application: a simple food-delivery
app that exists to be *observed* by Platform App. Multi-tenancy is the one
hard requirement; everything else stays as simple as possible — see
`docs/superpowers/specs/2026-08-15-platform-customer-app-split-notes.md` for
the full design discussion.

**Status:** all 4 services have real business logic (CRUD + health checks +
OTel instrumentation), DB migrations, seed data, and a Helm chart are in
place and build/lint/test clean locally. Not yet done: CI push/deploy wiring
beyond build+lint, and live validation on the actual cluster (nothing has
been deployed/observed running yet — see the per-service READMEs and the
deployment-guides note below).

**Tenant isolation, current state:** Customer App has no JWT/end-user auth
layer of its own (unlike Platform App). Each service trusts `X-Tenant-ID`
once a request reaches it. The Istio `AuthorizationPolicy` in
`infra/k8s/istio/authorization-policies/{dev,qa}/` restricts callers to the
`customer-app-{dev,qa}` namespace itself, so nothing outside this namespace
can reach these APIs or spoof a tenant header — but that also means there is
no traffic generator yet. See that policy file's comments for the full
rationale and the open question it defers.

## Services

| Service | Language | Role |
|---|---|---|
| `order-service` | Go | order placement/lifecycle |
| `catalog-service` | Python | restaurant/menu catalog |
| `delivery-service` | Java | delivery/rider tracking |
| `payment-service` | Java | mock payment processing |
| cache | Redis | shared cache layer |

## Tenancy

Each tenant is a separate branded food-delivery deployment (mirrors Platform
App's SaaS-tenant pattern). Shares Platform App's Postgres server, but with
its own set of tenant schemas — not Platform App's existing
`tenant_a`/`tenant_b`/`tenant_c`. Slugs: `customer_a`, `customer_b`,
`customer_c`, ... — registered in `public.customer_tenants` (separate from
Platform App's `public.tenants`), schemas built by
`public.create_customer_tenant_schema(slug)`. See
`database/migrations/000001_init_customer_registry.up.sql` and
`000002_customer_tenant_schema_function.up.sql`.

## Observability

Telemetry flows into Platform App's existing observability stack (no
separate stack of its own), tagged for tenant-wise segregation so Platform
App's AI agents can query per tenant.
