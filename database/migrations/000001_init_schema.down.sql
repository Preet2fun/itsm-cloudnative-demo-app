-- Migration: 000001_init_schema (rollback)
-- Description: Drop public.tenants registry table and extensions
-- WARNING: drops all tenant data in the registry

DROP INDEX  IF EXISTS public.idx_tenants_slug;
DROP TABLE  IF EXISTS public.tenants;

-- Extensions are intentionally left installed on rollback:
-- pgcrypto and pg_trgm may be used by other objects and are safe to keep.
