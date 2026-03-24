-- ============================================================================
-- Mediloop subscription / billing catalog (Neon public schema)
-- Matches: FeatureService, ProfessionalService, PlanService, SubscriptionService,
--          RateLimitService (rate_limit_usage)
--
-- If you see: public.features exists but has no "key" column:
--   1) Run migration_015a_rename_legacy_catalog_tables.sql once (renames legacy
--      tables), OR manually: ALTER TABLE public.features RENAME TO features_legacy;
--   2) Re-run this file.
-- If plan seeding fails with plan_features_plan_id_fkey: you likely had pre-existing
-- plan_features pointing at renamed legacy plans — run migration_016_plan_junctions_repoint.sql.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'features'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'features' AND column_name = 'key'
  ) THEN
    RAISE EXCEPTION
      'public.features exists but has no "key" column. Rename or drop it, then re-run migration_015_subscription_catalog.sql '
      '(e.g. ALTER TABLE public.features RENAME TO features_legacy;)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'key'
  ) THEN
    RAISE EXCEPTION
      'public.services exists but has no "key" column. Rename or drop it, then re-run migration_015_subscription_catalog.sql '
      '(e.g. ALTER TABLE public.services RENAME TO services_legacy;)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'plans'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'key'
  ) THEN
    RAISE EXCEPTION
      'public.plans exists but has no "key" column. Rename or drop it, then re-run migration_015_subscription_catalog.sql '
      '(e.g. ALTER TABLE public.plans RENAME TO plans_legacy;)';
  END IF;
END $$;

-- Catalog: features (rate limits, storage, capacity, etc.)
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT,
  default_value TEXT NOT NULL,
  value_type VARCHAR(32) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT features_key_unique UNIQUE (key)
);

CREATE INDEX IF NOT EXISTS idx_features_category ON public.features (category);

-- Professional / add-on services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT services_key_unique UNIQUE (key)
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services (category);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key VARCHAR(128) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  monthly_price_cents INTEGER,
  annual_price_cents INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plans_key_unique UNIQUE (key)
);

CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans (status);

-- Plan ↔ feature values
CREATE TABLE IF NOT EXISTS public.plan_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans (id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features (id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_features_plan_feature_unique UNIQUE (plan_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON public.plan_features (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_feature_id ON public.plan_features (feature_id);

-- Plan ↔ bundled services (quantity)
CREATE TABLE IF NOT EXISTS public.plan_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_services_plan_service_unique UNIQUE (plan_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_services_plan_id ON public.plan_services (plan_id);

-- Organization subscriptions (no FK to organizations — tests / multi-schema flexibility)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans (id) ON DELETE RESTRICT,
  status VARCHAR(32) NOT NULL,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON public.subscriptions (organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);

-- Per-subscription feature overrides
CREATE TABLE IF NOT EXISTS public.subscription_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions (id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features (id) ON DELETE CASCADE,
  override_value TEXT NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscription_feature_overrides_unique UNIQUE (subscription_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_sfo_subscription_id ON public.subscription_feature_overrides (subscription_id);

-- Rate limit usage windows (RateLimitService)
CREATE TABLE IF NOT EXISTS public.rate_limit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  feature_key VARCHAR(128) NOT NULL,
  endpoint_key VARCHAR(128) NOT NULL,
  ip_address VARCHAR(64),
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_usage_org_endpoint
  ON public.rate_limit_usage (organization_id, endpoint_key, window_start);
