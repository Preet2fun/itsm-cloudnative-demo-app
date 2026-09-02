-- platform-app/database/migrations/000006_create_shared_users
-- Migration: 000006_create_shared_users
-- Description: Creates public.users — the single shared identity table for
--              both Customer App's tenant-scoped end-users (tenant_id set
--              to a customer-app tenant slug) and Platform App's own
--              cross-tenant staff (tenant_id NULL). Purely additive: does
--              NOT touch public.tenants, create_tenant_schema, or any
--              tenant_a/b/c schema — see design spec §7 for why.
-- Idempotent: yes (CREATE TABLE/INDEX IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT        NOT NULL,
    password_hash   TEXT        NOT NULL,
    full_name       TEXT,
    role            TEXT        NOT NULL CHECK (role IN (
                        'admin', 'agent', 'viewer',
                        'platform_admin', 'platform_analyst'
                    )),
    tenant_id       TEXT,       -- NULL = platform staff, cross-tenant.
                                 -- set  = scoped to a customer-app tenant
                                 -- slug, validated at the app layer (no DB
                                 -- FK — see design spec §4.1/§6).
    is_active       BOOL        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_public_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_public_users_tenant_id ON public.users(tenant_id);
