-- Apply on your backend Postgres (e.g. Neon), same as other files in backend/migrations/.
-- Ensures teleconsultation_status includes `confirmed` (legacy DBs may omit it).
-- Safe to re-run: skips when the label already exists or the type is missing.

BEGIN;

DO $mig$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'teleconsultation_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'teleconsultation_status'
      AND e.enumlabel = 'confirmed'
  ) THEN
    ALTER TYPE public.teleconsultation_status ADD VALUE 'confirmed';
  END IF;
END
$mig$;

COMMIT;
