-- user_wearables: tenant-scoped (one row per user’s devices inside each tenant schema).
-- New tenants get this table from SchemaManager.createTenantTables.
-- This migration adds the table to existing tenant schemas and removes any legacy public copy.
--
-- Only processes rows where public.tenants.schema actually exists (avoids ROLLBACK when a
-- tenant row is orphaned: e.g. schema creation failed or schema was dropped manually).

BEGIN;

DROP TABLE IF EXISTS public.user_wearables;

DO $$
DECLARE
  tenant_schema TEXT;
BEGIN
  FOR tenant_schema IN
    SELECT t.schema
    FROM public.tenants t
    INNER JOIN information_schema.schemata s
      ON s.schema_name = t.schema
    WHERE t.schema IS NOT NULL
      AND t.schema <> ''
      AND t.schema ~ '^tenant_[a-zA-Z0-9_]+$'
  LOOP
    EXECUTE format(
      $ddl$
      CREATE TABLE IF NOT EXISTS %I.user_wearables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        device_type VARCHAR(64) NOT NULL CHECK (device_type IN (
          'apple_watch',
          'fitbit',
          'oura_ring',
          'samsung_galaxy_watch',
          'garmin',
          'whoop'
        )),
        device_name TEXT NOT NULL,
        device_id TEXT NOT NULL,
        connection_status TEXT NOT NULL DEFAULT 'connected',
        last_synced TIMESTAMPTZ,
        battery_level INTEGER,
        meta JSONB,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_wearables_user_id ON %I.user_wearables(user_id);
      $ddl$,
      tenant_schema,
      tenant_schema
    );
  END LOOP;
END $$;

COMMIT;
