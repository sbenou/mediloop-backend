-- Catalog CSV import is driven by TypeScript (normalizes Supabase column order, validates headers).
--
--   cd backend && deno task import-marketplace-catalog-csv
--   cd backend && deno task import-marketplace-catalog-csv-dev   # Neon development (DATABASE_URL_DEV)
--
-- Set MEDILOOP_CATALOG_IMPORT_CSV_DIR to the folder that contains:
--   categories_rows.csv, subcategories_rows.csv, products_rows.csv
-- (or set MEDILOOP_CATALOG_CSV_* full paths). Re-import with --truncate to clear duplicates.
--
-- Generated SQL lives under scripts/.catalog-import-tmp/ at runtime.

SELECT 'Use: deno task import-marketplace-catalog-csv' AS hint;
