# Customer App

Scaffolding only — no business logic yet. A brand-new, separate multi-tenant
demo application: a simple food-delivery app that exists to be *observed* by
Platform App. Multi-tenancy is the one hard requirement; everything else
stays as simple as possible — see
`docs/superpowers/specs/2026-08-15-platform-customer-app-split-notes.md` for
the full design discussion.

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
