-- Migration: 000005_phase7_ai_stubs
-- Description: Add Phase-7 AI tables (asset_embeddings, incident_ai_analysis)
--              as empty stubs so the schema is forward-compatible.
--              These tables are INERT until Phase 7 activates pgvector and
--              the AI service begins writing to them.
-- Idempotent: yes
-- NOTE: pgvector extension is NOT required here; the vector column is defined
--       as TEXT placeholder until 000007_enable_pgvector.up.sql runs in Phase 7.

-- ── Helper — add AI stub tables to a tenant schema ───────────────────────────
CREATE OR REPLACE FUNCTION public.add_ai_stubs(slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- asset_embeddings: stores vector embedding per asset for similarity search
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.asset_embeddings (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            asset_id        UUID        NOT NULL REFERENCES %I.assets(id) ON DELETE CASCADE,
            embedding       TEXT,          -- replaced with vector(1536) in Phase 7
            model_version   TEXT        NOT NULL DEFAULT ''stub'',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE UNIQUE INDEX IF NOT EXISTS %I ON %I.asset_embeddings(asset_id)',
        slug || '_asset_emb_asset_idx', slug);

    -- incident_ai_analysis: stores LLM-generated triage per incident
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.incident_ai_analysis (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            incident_id     UUID        NOT NULL REFERENCES %I.incidents(id) ON DELETE CASCADE,
            summary         TEXT,
            suggested_priority TEXT,
            similar_incident_ids UUID[],
            raw_response    JSONB       NOT NULL DEFAULT ''{}''::jsonb,
            model_version   TEXT        NOT NULL DEFAULT ''stub'',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.incident_ai_analysis(incident_id)',
        slug || '_inc_ai_incident_idx', slug);
END;
$$;

-- Attach to seed tenant schemas (conditional — skipped if schema not yet created)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_a') THEN
        PERFORM public.add_ai_stubs('tenant_a');
    END IF;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_b') THEN
        PERFORM public.add_ai_stubs('tenant_b');
    END IF;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_c') THEN
        PERFORM public.add_ai_stubs('tenant_c');
    END IF;
END;
$$;
