-- Migration: 000004_updated_at_triggers
-- Description: Create a reusable trigger function and attach it to every
--              table that has an updated_at column so the column is always
--              maintained automatically by PostgreSQL (no app-layer burden).
-- Idempotent: yes

-- ── Shared trigger function (public schema, available to all tenant schemas) ─
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ── Helper macro — attach trigger to a given table ────────────────────────────
-- Usage: SELECT public.attach_updated_at_trigger('tenant_a', 'users');
CREATE OR REPLACE FUNCTION public.attach_updated_at_trigger(
    schema_name TEXT,
    table_name  TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    trigger_name TEXT := schema_name || '_' || table_name || '_set_updated_at';
BEGIN
    EXECUTE format('
        CREATE OR REPLACE TRIGGER %I
        BEFORE UPDATE ON %I.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
        trigger_name, schema_name, table_name);
END;
$$;

-- ── Attach triggers to seed tenant schemas ────────────────────────────────────
-- Each block is conditional — silently skipped if the schema doesn't exist yet.
-- create-tenants.sh also calls attach_updated_at_trigger per tenant, so both
-- paths (migrations-first or script-first) are safe and idempotent.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_a') THEN
        PERFORM public.attach_updated_at_trigger('tenant_a', 'users');
        PERFORM public.attach_updated_at_trigger('tenant_a', 'assets');
        PERFORM public.attach_updated_at_trigger('tenant_a', 'incidents');
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_b') THEN
        PERFORM public.attach_updated_at_trigger('tenant_b', 'users');
        PERFORM public.attach_updated_at_trigger('tenant_b', 'assets');
        PERFORM public.attach_updated_at_trigger('tenant_b', 'incidents');
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'tenant_c') THEN
        PERFORM public.attach_updated_at_trigger('tenant_c', 'users');
        PERFORM public.attach_updated_at_trigger('tenant_c', 'assets');
        PERFORM public.attach_updated_at_trigger('tenant_c', 'incidents');
    END IF;
END;
$$;
