-- Migration: 000002_tenant_schema_function
-- Description: Stored procedure to create an isolated schema for a new tenant.
--              Calling create_tenant_schema('acme') creates schema "acme" with
--              all application tables (users, assets, incidents, incident_events).
--              Phase-7 AI stubs are added in migration 000005.
-- Idempotent: yes (uses CREATE … IF NOT EXISTS throughout)

CREATE OR REPLACE FUNCTION public.create_tenant_schema(slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- ── 1. Create schema ─────────────────────────────────────────────────────
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', slug);

    -- ── 2. users ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            email           TEXT        NOT NULL,
            password_hash   TEXT        NOT NULL,
            full_name       TEXT        NOT NULL,
            role            TEXT        NOT NULL CHECK (role IN (''admin'',''agent'',''viewer'')),
            is_active       BOOL        NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug);

    EXECUTE format('
        CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I.users(email)',
        slug || '_users_email_idx', slug);

    -- ── 3. assets ────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.assets (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            name            TEXT        NOT NULL,
            asset_type      TEXT        NOT NULL CHECK (asset_type IN (''hardware'',''software'',''network'')),
            serial_number   TEXT,
            status          TEXT        NOT NULL DEFAULT ''active''
                                CHECK (status IN (''active'',''inactive'',''retired'',''maintenance'')),
            location        TEXT,
            assigned_to     UUID        REFERENCES %I.users(id) ON DELETE SET NULL,
            purchased_at    DATE,
            warranty_until  DATE,
            metadata        JSONB       NOT NULL DEFAULT ''{}''::jsonb,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.assets(asset_type)',
        slug || '_assets_type_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.assets(status)',
        slug || '_assets_status_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.assets USING gin(metadata)',
        slug || '_assets_metadata_gin', slug);

    -- ── 4. incidents ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.incidents (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            title           TEXT        NOT NULL,
            description     TEXT        NOT NULL DEFAULT '''',
            priority        TEXT        NOT NULL CHECK (priority IN (''P1'',''P2'',''P3'',''P4'')),
            status          TEXT        NOT NULL DEFAULT ''open''
                                CHECK (status IN (''open'',''in_progress'',''resolved'',''closed'')),
            assigned_to     UUID        REFERENCES %I.users(id) ON DELETE SET NULL,
            related_asset   UUID        REFERENCES %I.assets(id) ON DELETE SET NULL,
            resolved_at     TIMESTAMPTZ,
            sla_breach_at   TIMESTAMPTZ,           -- computed on insert by app layer
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incidents(priority)',
        slug || '_incidents_priority_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incidents(status)',
        slug || '_incidents_status_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incidents(assigned_to)',
        slug || '_incidents_assigned_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incidents(created_at DESC)',
        slug || '_incidents_created_desc', slug);

    -- ── 5. incident_events ───────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.incident_events (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            incident_id     UUID        NOT NULL REFERENCES %I.incidents(id) ON DELETE CASCADE,
            actor_id        UUID        REFERENCES %I.users(id) ON DELETE SET NULL,
            event_type      TEXT        NOT NULL
                                CHECK (event_type IN (
                                    ''comment'',''status_change'',''priority_change'',
                                    ''assignment'',''resolution'',''ai_suggestion''
                                )),
            payload         JSONB       NOT NULL DEFAULT ''{}''::jsonb,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incident_events(incident_id)',
        slug || '_inc_events_incident_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incident_events(created_at DESC)',
        slug || '_inc_events_created_desc', slug);

END;
$$;
