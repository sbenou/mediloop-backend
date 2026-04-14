-- =============================================================================
-- List all non-system base tables (schema.name) — paste the result to align
-- dev_reset_keep_subscription_catalog.sql
-- =============================================================================
-- Run in Neon SQL Editor or: psql "$DATABASE_URL" -f scripts/sql/dev_inventory_for_reset.sql
-- =============================================================================

SELECT
  table_schema || '.' || table_name AS table_full_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND table_schema NOT LIKE 'pg\_%' ESCAPE '\'
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
