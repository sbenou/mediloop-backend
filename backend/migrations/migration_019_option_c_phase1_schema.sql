-- Option C — Phase 1: schema foundations (additive only).
-- Safe to run on existing DBs: new tables; new nullable/well-backfilled columns;
-- no renames; no drops. Application code may ignore these until Phases 2–4.
--
-- See: docs/architecture-option-c-decisions.md

BEGIN;

-- ---------------------------------------------------------------------------
-- public.tenants: tenant kind (nullable for legacy rows)
-- ---------------------------------------------------------------------------
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS tenant_type VARCHAR(32);

COMMENT ON COLUMN public.tenants.tenant_type IS
  'personal_health | clinic | doctor_cabinet | hospital | pharmacy | lab (future); NULL = legacy/unset';

-- ---------------------------------------------------------------------------
-- public.personal_health_tenants: one personal-health tenant per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personal_health_tenants (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_health_tenants_tenant
  ON public.personal_health_tenants(tenant_id);

-- ---------------------------------------------------------------------------
-- public.tenant_invitations: pending / completed invite flow (not memberships)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  token_hash TEXT NOT NULL,
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenant_invitations_status_check CHECK (
    status IN ('pending', 'accepted', 'expired', 'revoked')
  )
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_email
  ON public.tenant_invitations(tenant_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status ON public.tenant_invitations(tenant_id, status);

-- ---------------------------------------------------------------------------
-- public.user_tenants: lifecycle fields (keeps is_active / is_primary for compat)
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_tenants
  ADD COLUMN IF NOT EXISTS status VARCHAR(32),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.user_tenants ut
SET status = CASE
  WHEN ut.is_active IS FALSE THEN 'left'
  ELSE 'active'
END
WHERE ut.status IS NULL;

ALTER TABLE public.user_tenants
  ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.user_tenants
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_tenants_status_check'
  ) THEN
    ALTER TABLE public.user_tenants
      ADD CONSTRAINT user_tenants_status_check CHECK (
        status IN ('active', 'suspended', 'revoked', 'left')
      );
  END IF;
END $$;

COMMENT ON COLUMN public.user_tenants.is_primary IS
  'Legacy default-workspace flag; Option C doc uses is_default — consolidate in a later phase.';

-- ---------------------------------------------------------------------------
-- public.audit_events: structured audit trail (Option C)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  membership_id UUID REFERENCES public.user_tenants(id) ON DELETE SET NULL,
  role VARCHAR(50),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  target_patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_patient_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  outcome VARCHAR(16) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_events_outcome_check CHECK (
    outcome IN ('success', 'denied', 'error')
  )
);

CREATE INDEX IF NOT EXISTS idx_audit_events_occurred_at ON public.audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON public.audit_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_id ON public.audit_events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON public.audit_events(action, occurred_at DESC);

COMMIT;
