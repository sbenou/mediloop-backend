-- Option C — Phase 3: professional workspace + acting membership on clinical rows.
-- Additive only; NULL = legacy / unattributed (see architecture-option-c-decisions.md §2).
--
-- Apply after migration_018 (prescriptions / teleconsultations / doctor_patient_connections).

BEGIN;

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

COMMIT;
