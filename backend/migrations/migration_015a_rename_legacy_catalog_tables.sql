-- ============================================================================
-- OPTIONAL — run BEFORE migration_015_subscription_catalog.sql
--
-- Use when Neon already has public.features / services / plans from an old
-- schema (no "key" column). This renames them so migration_015 can create
-- the Mediloop subscription catalog tables.
--
-- Safe for test DBs. On production, inspect data and FKs before running.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'features'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'features' AND column_name = 'key'
  ) THEN
    ALTER TABLE public.features RENAME TO features_legacy_pre_subscription_catalog;
    RAISE NOTICE 'Renamed public.features -> features_legacy_pre_subscription_catalog';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'key'
  ) THEN
    ALTER TABLE public.services RENAME TO services_legacy_pre_subscription_catalog;
    RAISE NOTICE 'Renamed public.services -> services_legacy_pre_subscription_catalog';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'plans'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'key'
  ) THEN
    ALTER TABLE public.plans RENAME TO plans_legacy_pre_subscription_catalog;
    RAISE NOTICE 'Renamed public.plans -> plans_legacy_pre_subscription_catalog';
  END IF;
END $$;
