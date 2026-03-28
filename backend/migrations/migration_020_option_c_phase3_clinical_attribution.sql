-- Option C — Phase 3: professional workspace + acting membership on clinical rows.
-- Additive only; NULL = legacy / unattributed (see architecture-option-c-decisions.md §2).
--
-- Prerequisite: clinical tables from migration_018_prescriptions_teleconsultations.sql
-- (public.prescriptions, public.teleconsultations, public.doctor_patient_connections).
--
-- If those tables do not exist yet, this script skips them without error — run
-- migration_018 first, then execute this migration again to add the columns.

BEGIN;

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
DO $p$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'prescriptions'
  ) THEN
    ALTER TABLE public.prescriptions
      ADD COLUMN IF NOT EXISTS professional_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_by_membership_id UUID REFERENCES public.user_tenants(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.prescriptions.professional_tenant_id IS
      'Tenant (workspace) under which the prescription was issued; NULL = legacy row';
    COMMENT ON COLUMN public.prescriptions.created_by_membership_id IS
      'user_tenants.id of the acting membership when created; NULL = legacy row';

    CREATE INDEX IF NOT EXISTS idx_prescriptions_professional_tenant
      ON public.prescriptions(professional_tenant_id)
      WHERE professional_tenant_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'migration_020: skipped public.prescriptions (table missing — run migration_018, then re-run this file)';
  END IF;
END
$p$;

-- ---------------------------------------------------------------------------
-- teleconsultations
-- ---------------------------------------------------------------------------
DO $t$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teleconsultations'
  ) THEN
    ALTER TABLE public.teleconsultations
      ADD COLUMN IF NOT EXISTS professional_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_by_membership_id UUID REFERENCES public.user_tenants(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.teleconsultations.professional_tenant_id IS
      'Tenant (workspace) under which the teleconsultation was booked; NULL = legacy row';
    COMMENT ON COLUMN public.teleconsultations.created_by_membership_id IS
      'user_tenants.id of the acting membership when created; NULL = legacy row';

    CREATE INDEX IF NOT EXISTS idx_teleconsultations_professional_tenant
      ON public.teleconsultations(professional_tenant_id)
      WHERE professional_tenant_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'migration_020: skipped public.teleconsultations (table missing — run migration_018, then re-run this file)';
  END IF;
END
$t$;

-- ---------------------------------------------------------------------------
-- doctor_patient_connections
-- ---------------------------------------------------------------------------
DO $d$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'doctor_patient_connections'
  ) THEN
    ALTER TABLE public.doctor_patient_connections
      ADD COLUMN IF NOT EXISTS professional_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_by_membership_id UUID REFERENCES public.user_tenants(id) ON DELETE SET NULL;

    COMMENT ON COLUMN public.doctor_patient_connections.professional_tenant_id IS
      'Workspace context for the connection; NULL = legacy row';
    COMMENT ON COLUMN public.doctor_patient_connections.created_by_membership_id IS
      'Acting membership when the connection was created; NULL = legacy row';

    CREATE INDEX IF NOT EXISTS idx_dpc_professional_tenant
      ON public.doctor_patient_connections(professional_tenant_id)
      WHERE professional_tenant_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'migration_020: skipped public.doctor_patient_connections (table missing — run migration_018, then re-run this file)';
  END IF;
END
$d$;

COMMIT;
