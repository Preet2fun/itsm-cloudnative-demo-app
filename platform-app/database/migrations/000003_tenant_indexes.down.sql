-- Migration: 000003_tenant_indexes (rollback)
-- Description: Drop trigram search indexes from seed tenant schemas.

-- tenant_a
DROP INDEX IF EXISTS tenant_a.tenant_a_users_fullname_trgm;
DROP INDEX IF EXISTS tenant_a.tenant_a_assets_name_trgm;
DROP INDEX IF EXISTS tenant_a.tenant_a_incidents_title_trgm;
DROP INDEX IF EXISTS tenant_a.tenant_a_incidents_description_trgm;

-- tenant_b
DROP INDEX IF EXISTS tenant_b.tenant_b_users_fullname_trgm;
DROP INDEX IF EXISTS tenant_b.tenant_b_assets_name_trgm;
DROP INDEX IF EXISTS tenant_b.tenant_b_incidents_title_trgm;
DROP INDEX IF EXISTS tenant_b.tenant_b_incidents_description_trgm;

-- tenant_c
DROP INDEX IF EXISTS tenant_c.tenant_c_users_fullname_trgm;
DROP INDEX IF EXISTS tenant_c.tenant_c_assets_name_trgm;
DROP INDEX IF EXISTS tenant_c.tenant_c_incidents_title_trgm;
DROP INDEX IF EXISTS tenant_c.tenant_c_incidents_description_trgm;
