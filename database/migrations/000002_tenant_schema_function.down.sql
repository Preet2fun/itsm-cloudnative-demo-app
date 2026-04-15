-- Migration: 000002_tenant_schema_function (rollback)
-- Description: Drop create_tenant_schema stored procedure.
--              Does NOT drop any tenant schemas — those are dropped manually
--              or as part of tenant off-boarding (not a migration concern).

DROP FUNCTION IF EXISTS public.create_tenant_schema(TEXT);
