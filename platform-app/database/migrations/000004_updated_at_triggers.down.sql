-- Migration: 000004_updated_at_triggers (rollback)
-- Description: Drop updated_at triggers and helper functions.

-- Drop per-schema triggers (tenant_a)
DROP TRIGGER IF EXISTS tenant_a_users_set_updated_at    ON tenant_a.users;
DROP TRIGGER IF EXISTS tenant_a_assets_set_updated_at   ON tenant_a.assets;
DROP TRIGGER IF EXISTS tenant_a_incidents_set_updated_at ON tenant_a.incidents;

-- Drop per-schema triggers (tenant_b)
DROP TRIGGER IF EXISTS tenant_b_users_set_updated_at    ON tenant_b.users;
DROP TRIGGER IF EXISTS tenant_b_assets_set_updated_at   ON tenant_b.assets;
DROP TRIGGER IF EXISTS tenant_b_incidents_set_updated_at ON tenant_b.incidents;

-- Drop per-schema triggers (tenant_c)
DROP TRIGGER IF EXISTS tenant_c_users_set_updated_at    ON tenant_c.users;
DROP TRIGGER IF EXISTS tenant_c_assets_set_updated_at   ON tenant_c.assets;
DROP TRIGGER IF EXISTS tenant_c_incidents_set_updated_at ON tenant_c.incidents;

DROP FUNCTION IF EXISTS public.attach_updated_at_trigger(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.set_updated_at();
