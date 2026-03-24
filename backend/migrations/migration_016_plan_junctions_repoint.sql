-- ============================================================================
-- Fix plan_features / plan_services FK after migration_015a + 015
--
-- If `plan_features` existed BEFORE you renamed legacy `plans` →
-- `plans_legacy_pre_subscription_catalog`, PostgreSQL repointed those FKs to the
-- legacy table. Migration 015 then did CREATE TABLE IF NOT EXISTS on
-- plan_features, so the old junction table was kept — still referencing legacy
-- plans, not the new public.plans. Seeds then fail with:
--   plan_features_plan_id_fkey violation
--
-- This migration drops the stale junction tables and recreates them against the
-- current public.plans / features / services. Safe on empty test DBs; on prod,
-- backup junction data first if needed.
-- ============================================================================

DROP TABLE IF EXISTS public.plan_features CASCADE;
DROP TABLE IF EXISTS public.plan_services CASCADE;

CREATE TABLE public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans (id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features (id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_features_plan_feature_unique UNIQUE (plan_id, feature_id)
);

CREATE INDEX idx_plan_features_plan_id ON public.plan_features (plan_id);
CREATE INDEX idx_plan_features_feature_id ON public.plan_features (feature_id);

CREATE TABLE public.plan_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_services_plan_service_unique UNIQUE (plan_id, service_id)
);

CREATE INDEX idx_plan_services_plan_id ON public.plan_services (plan_id);
