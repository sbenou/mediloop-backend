-- Option C — Phase 4: explicit clinical attribution_status on professional-origin rows.
-- See docs/architecture-option-c-phase4-design.md §1.6.
--
-- Prerequisite: migration_020 (professional_tenant_id + created_by_membership_id).
--
-- Rules after data backfill in this file:
--   attributed      → professional_tenant_id IS NOT NULL
--   legacy_pending / quarantined → professional_tenant_id IS NULL
--
-- Application code must set attribution_status = 'attributed' on new professional writes
-- alongside tenant + membership (Phase 3 POST paths).

BEGIN;

DO $$
BEGIN
  CREATE TYPE public.clinical_attribution_status AS ENUM (
    'attributed',
    'legacy_pending',
    'quarantined'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE public.clinical_attribution_status IS
  'Phase 4: attributed = normal scoped APIs; legacy_pending / quarantined = excluded from standard professional lists until resolved.';

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
DO $pr$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'prescriptions'
  ) THEN
    ALTER TABLE public.prescriptions
      ADD COLUMN IF NOT EXISTS attribution_status public.clinical_attribution_status
        NOT NULL DEFAULT 'legacy_pending';

    COMMENT ON COLUMN public.prescriptions.attribution_status IS
      'Phase 4: policy state; see architecture-option-c-phase4-design.md';

    UPDATE public.prescriptions
    SET attribution_status = 'attributed'
    WHERE professional_tenant_id IS NOT NULL
      AND attribution_status = 'legacy_pending';

    BEGIN
      ALTER TABLE public.prescriptions
        ADD CONSTRAINT chk_prescriptions_attribution_status_consistency CHECK (
          (professional_tenant_id IS NOT NULL AND attribution_status = 'attributed'::public.clinical_attribution_status)
          OR (
            professional_tenant_id IS NULL
            AND attribution_status IN (
              'legacy_pending'::public.clinical_attribution_status,
              'quarantined'::public.clinical_attribution_status
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    CREATE INDEX IF NOT EXISTS idx_prescriptions_attribution_status_review
      ON public.prescriptions(attribution_status)
      WHERE attribution_status IN ('legacy_pending', 'quarantined');
  ELSE
    RAISE NOTICE 'migration_023: skipped public.prescriptions (table missing)';
  END IF;
END
$pr$;

-- ---------------------------------------------------------------------------
-- teleconsultations
-- ---------------------------------------------------------------------------
DO $tc$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teleconsultations'
  ) THEN
    ALTER TABLE public.teleconsultations
      ADD COLUMN IF NOT EXISTS attribution_status public.clinical_attribution_status
        NOT NULL DEFAULT 'legacy_pending';

    COMMENT ON COLUMN public.teleconsultations.attribution_status IS
      'Phase 4: policy state; see architecture-option-c-phase4-design.md';

    UPDATE public.teleconsultations
    SET attribution_status = 'attributed'
    WHERE professional_tenant_id IS NOT NULL
      AND attribution_status = 'legacy_pending';

    BEGIN
      ALTER TABLE public.teleconsultations
        ADD CONSTRAINT chk_teleconsultations_attribution_status_consistency CHECK (
          (professional_tenant_id IS NOT NULL AND attribution_status = 'attributed'::public.clinical_attribution_status)
          OR (
            professional_tenant_id IS NULL
            AND attribution_status IN (
              'legacy_pending'::public.clinical_attribution_status,
              'quarantined'::public.clinical_attribution_status
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    CREATE INDEX IF NOT EXISTS idx_teleconsultations_attribution_status_review
      ON public.teleconsultations(attribution_status)
      WHERE attribution_status IN ('legacy_pending', 'quarantined');
  ELSE
    RAISE NOTICE 'migration_023: skipped public.teleconsultations (table missing)';
  END IF;
END
$tc$;

-- ---------------------------------------------------------------------------
-- doctor_patient_connections
-- ---------------------------------------------------------------------------
DO $dpc$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'doctor_patient_connections'
  ) THEN
    ALTER TABLE public.doctor_patient_connections
      ADD COLUMN IF NOT EXISTS attribution_status public.clinical_attribution_status
        NOT NULL DEFAULT 'legacy_pending';

    COMMENT ON COLUMN public.doctor_patient_connections.attribution_status IS
      'Phase 4: policy state; see architecture-option-c-phase4-design.md';

    UPDATE public.doctor_patient_connections
    SET attribution_status = 'attributed'
    WHERE professional_tenant_id IS NOT NULL
      AND attribution_status = 'legacy_pending';

    BEGIN
      ALTER TABLE public.doctor_patient_connections
        ADD CONSTRAINT chk_dpc_attribution_status_consistency CHECK (
          (professional_tenant_id IS NOT NULL AND attribution_status = 'attributed'::public.clinical_attribution_status)
          OR (
            professional_tenant_id IS NULL
            AND attribution_status IN (
              'legacy_pending'::public.clinical_attribution_status,
              'quarantined'::public.clinical_attribution_status
            )
          )
        );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    CREATE INDEX IF NOT EXISTS idx_dpc_attribution_status_review
      ON public.doctor_patient_connections(attribution_status)
      WHERE attribution_status IN ('legacy_pending', 'quarantined');
  ELSE
    RAISE NOTICE 'migration_023: skipped public.doctor_patient_connections (table missing)';
  END IF;
END
$dpc$;

-- Keep attribution_status consistent with professional_tenant_id on new writes:
-- Phase 3 POST paths omit attribution_status; default would be legacy_pending which
-- violates CHECK when tenant is set. BEFORE INSERT / tenant UPDATE → force attributed.
CREATE OR REPLACE FUNCTION public.sync_clinical_attribution_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.professional_tenant_id IS NOT NULL THEN
    NEW.attribution_status := 'attributed'::public.clinical_attribution_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prescriptions_sync_attribution_status ON public.prescriptions;
CREATE TRIGGER trg_prescriptions_sync_attribution_status
  BEFORE INSERT OR UPDATE OF professional_tenant_id ON public.prescriptions
  FOR EACH ROW EXECUTE PROCEDURE public.sync_clinical_attribution_status();

DROP TRIGGER IF EXISTS trg_teleconsultations_sync_attribution_status ON public.teleconsultations;
CREATE TRIGGER trg_teleconsultations_sync_attribution_status
  BEFORE INSERT OR UPDATE OF professional_tenant_id ON public.teleconsultations
  FOR EACH ROW EXECUTE PROCEDURE public.sync_clinical_attribution_status();

DROP TRIGGER IF EXISTS trg_dpc_sync_attribution_status ON public.doctor_patient_connections;
CREATE TRIGGER trg_dpc_sync_attribution_status
  BEFORE INSERT OR UPDATE OF professional_tenant_id ON public.doctor_patient_connections
  FOR EACH ROW EXECUTE PROCEDURE public.sync_clinical_attribution_status();

COMMENT ON FUNCTION public.sync_clinical_attribution_status IS
  'Phase 4: when professional_tenant_id is set, force attribution_status = attributed.';

COMMIT;
