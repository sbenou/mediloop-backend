-- Migration 028: Link existing patients to personal_health_tenants + tag tenant_type
-- Apply after 019 (tenants.tenant_type, personal_health_tenants exist).
-- For doctors/pharmacists missing a PH workspace, run:
--   deno task backfill-professional-personal-health

BEGIN;

UPDATE public.tenants t
SET tenant_type = 'personal_health',
    updated_at = NOW()
FROM auth.users u
JOIN public.user_tenants ut ON ut.user_id = u.id AND ut.is_primary = true
WHERE ut.tenant_id = t.id
  AND u.role = 'patient'
  AND (t.tenant_type IS NULL OR t.tenant_type IN ('personal', 'personal_health'));

INSERT INTO public.personal_health_tenants (user_id, tenant_id)
SELECT ut.user_id, ut.tenant_id
FROM public.user_tenants ut
JOIN auth.users u ON u.id = ut.user_id
WHERE u.role = 'patient'
  AND ut.is_primary = true
  AND NOT EXISTS (
    SELECT 1 FROM public.personal_health_tenants p WHERE p.user_id = ut.user_id
  )
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
