-- Migration: 000001_init_schema
-- Description: Enable extensions and create public.tenants registry table
-- Idempotent: yes

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid(), crypt()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram indexes for text search (Phase 7)

-- Tenant registry (shared across all tenant schemas)
CREATE TABLE IF NOT EXISTS public.tenants (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    slug        TEXT        UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active   BOOL        NOT NULL DEFAULT TRUE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
