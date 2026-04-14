-- =============================================================================
-- DEV / TEST ONLY — reclaim Neon storage (tenant schemas + public churn)
-- =============================================================================
-- For a full reset (no users, keep subscription catalog only), use instead:
--   scripts/sql/dev_reset_keep_subscription_catalog.sql
--
-- Read the whole file before running. Take a Neon branch backup or snapshot
-- if anything matters. Not for production.
--
-- Strategy:
--   1) See which schemas use space (especially tenant_*).
--   2) Drop ORPHAN tenant_* schemas (no row in public.tenants) — safest bulk win.
--   3) Optionally drop tenant schemas for tenants you intentionally remove (manual).
--   4) Optionally TRUNCATE public transactional tables; KEEP reference seeds:
--      public.bank_holidays, public.catalog_*, subscription catalog tables, etc.
--
-- Run from psql:
--   cd backend && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/dev_neon_reclaim_storage.sql
-- Or paste sections in Neon SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Approximate size per schema (helps find fat tenant_* copies)
-- -----------------------------------------------------------------------------
SELECT
  n.nspname AS schema,
  pg_size_pretty(sum(pg_total_relation_size(c.oid))::bigint) AS total_size,
  sum(pg_total_relation_size(c.oid))::bigint AS bytes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND c.relkind IN ('r', 'm', 'i', 't')
GROUP BY n.nspname
ORDER BY bytes DESC
LIMIT 40;

-- -----------------------------------------------------------------------------
-- 2) Orphan tenant schemas: exist in Postgres but NOT in public.tenants.schema
--    Review the list, then run the generated DROPs (section 2b).
-- -----------------------------------------------------------------------------
-- 2a) Preview
SELECT n.nspname AS orphan_schema
FROM pg_namespace n
WHERE n.nspname ~ '^tenant_'
  AND NOT EXISTS (
    SELECT 1 FROM public.tenants t WHERE t.schema = n.nspname
  )
ORDER BY 1;

-- 2b) Generated DROP statements (copy/paste from query result, or run below)
SELECT format('DROP SCHEMA IF EXISTS %I CASCADE; -- orphan', n.nspname) AS stmt
FROM pg_namespace n
WHERE n.nspname ~ '^tenant_'
  AND NOT EXISTS (
    SELECT 1 FROM public.tenants t WHERE t.schema = n.nspname
  )
ORDER BY 1;

-- -----------------------------------------------------------------------------
-- 3) Remove registered tenants you no longer want (MANUAL — edit UUIDs)
-- -----------------------------------------------------------------------------
-- For each tenant you delete you must:
--   a) Resolve FKs: public.user_tenants, public.personal_health_tenants,
--      clinical rows with professional_tenant_id, invitations, etc.
--   b) DROP SCHEMA "<schema from tenants.schema>" CASCADE;
--   c) DELETE FROM public.tenants WHERE id = '...';
--
-- Example pattern only — do NOT run blind:
-- BEGIN;
-- DELETE FROM public.user_tenants WHERE tenant_id = 'PASTE-UUID';
-- DELETE FROM public.personal_health_tenants WHERE tenant_id = 'PASTE-UUID';
-- -- add other tenant_id FK cleanups your DB has
-- DROP SCHEMA IF EXISTS "tenant_xxxxxxxx_xxxx_xxxx_xxxx_xxxxxxxxxxxx" CASCADE;
-- DELETE FROM public.tenants WHERE id = 'PASTE-UUID';
-- COMMIT;

-- -----------------------------------------------------------------------------
-- 4) Truncate public “churn” tables (preserves bank_holidays, catalog_*, plans)
-- -----------------------------------------------------------------------------
-- Uncomment ONLY when you are sure. Re-seed demo data with
-- backend/seeds/seed_clinical_platform_demo.sql if needed.
--
-- BEGIN;
-- TRUNCATE TABLE
--   public.notification_deliveries,
--   public.notification_preferences,
--   public.notifications
-- RESTART IDENTITY CASCADE;
--
-- TRUNCATE TABLE
--   public.prescriptions,
--   public.teleconsultations,
--   public.doctor_patient_connections,
--   public.doctor_availability
-- RESTART IDENTITY CASCADE;
--
-- -- Marketplace demo rows (optional — keep if you rely on them)
-- -- TRUNCATE TABLE public.orders RESTART IDENTITY CASCADE;
-- -- DELETE FROM public.pharmacies;  -- only if no FKs block it
--
-- COMMIT;

-- -----------------------------------------------------------------------------
-- 5) auth.users — only if you truly want to wipe accounts (usually skip)
-- -----------------------------------------------------------------------------
-- Deleting users cascades many things. Prefer Neon “reset branch” for a clean
-- slate instead of hand-deleting from auth.users.
