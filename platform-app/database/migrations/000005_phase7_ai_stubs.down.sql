-- Migration: 000005_phase7_ai_stubs (rollback)
-- Description: Drop AI stub tables from seed tenant schemas.

-- tenant_a
DROP TABLE IF EXISTS tenant_a.incident_ai_analysis;
DROP TABLE IF EXISTS tenant_a.asset_embeddings;

-- tenant_b
DROP TABLE IF EXISTS tenant_b.incident_ai_analysis;
DROP TABLE IF EXISTS tenant_b.asset_embeddings;

-- tenant_c
DROP TABLE IF EXISTS tenant_c.incident_ai_analysis;
DROP TABLE IF EXISTS tenant_c.asset_embeddings;

DROP FUNCTION IF EXISTS public.add_ai_stubs(TEXT);
