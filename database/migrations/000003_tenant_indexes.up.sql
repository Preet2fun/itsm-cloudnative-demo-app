-- Migration: 000003_tenant_indexes
-- Description: Add trigram full-text search indexes to the three seed tenant
--              schemas (tenant_a, tenant_b, tenant_c).  New tenants created
--              via create_tenant_schema() already get standard B-tree indexes;
--              this migration retrofits trgm indexes used for Phase 7 search
--              on the pre-seeded schemas.
-- Idempotent: yes (CREATE INDEX IF NOT EXISTS, wrapped in schema-existence check)
-- Prerequisite: pg_trgm extension (migration 000001).
-- NOTE: Each block is conditional — if the schema doesn't exist yet (i.e. this
--       migration runs before create-tenants.sh), the block is silently skipped.
--       create-tenants.sh also creates these indexes itself, so both paths are safe.

-- ── tenant_a ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_a') THEN
        CREATE INDEX IF NOT EXISTS tenant_a_users_fullname_trgm
            ON tenant_a.users USING gin(full_name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_a_assets_name_trgm
            ON tenant_a.assets USING gin(name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_a_incidents_title_trgm
            ON tenant_a.incidents USING gin(title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_a_incidents_description_trgm
            ON tenant_a.incidents USING gin(description gin_trgm_ops);
    END IF;
END;
$$;

-- ── tenant_b ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_b') THEN
        CREATE INDEX IF NOT EXISTS tenant_b_users_fullname_trgm
            ON tenant_b.users USING gin(full_name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_b_assets_name_trgm
            ON tenant_b.assets USING gin(name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_b_incidents_title_trgm
            ON tenant_b.incidents USING gin(title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_b_incidents_description_trgm
            ON tenant_b.incidents USING gin(description gin_trgm_ops);
    END IF;
END;
$$;

-- ── tenant_c ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_c') THEN
        CREATE INDEX IF NOT EXISTS tenant_c_users_fullname_trgm
            ON tenant_c.users USING gin(full_name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_c_assets_name_trgm
            ON tenant_c.assets USING gin(name gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_c_incidents_title_trgm
            ON tenant_c.incidents USING gin(title gin_trgm_ops);
        CREATE INDEX IF NOT EXISTS tenant_c_incidents_description_trgm
            ON tenant_c.incidents USING gin(description gin_trgm_ops);
    END IF;
END;
$$;
