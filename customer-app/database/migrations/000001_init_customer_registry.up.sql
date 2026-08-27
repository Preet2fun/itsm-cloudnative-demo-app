-- Migration: 000001_init_customer_registry
-- Description: Enable extensions and create public.customer_tenants registry.
--              Separate from Platform App's public.tenants by design — Customer
--              App tenants are their own registry, sharing only the Postgres
--              server/database, not the tenant namespace.
-- Idempotent: yes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS public.customer_tenants (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    slug        TEXT        UNIQUE NOT NULL,  -- e.g. 'customer_a' — also the schema name
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active   BOOL        NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_tenants_slug ON public.customer_tenants(slug);
