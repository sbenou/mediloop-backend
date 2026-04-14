-- Migration 027: Notifications — Option C scope, delivery log, preferences
-- Apply after migration_012_notifications.sql. Extends public.notifications for
-- workspace-scoped reads (personal_health | professional_personal | tenant) and
-- compliance-oriented metadata. Adds notification_deliveries + notification_preferences.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Extend public.notifications
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS scope_type TEXT,
  ADD COLUMN IF NOT EXISTS scope_tenant_id UUID,
  ADD COLUMN IF NOT EXISTS scope_membership_id UUID,
  ADD COLUMN IF NOT EXISTS workspace_kind TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS body_preview TEXT,
  ADD COLUMN IF NOT EXISTS contains_sensitive_health_data BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS source_resource_type TEXT,
  ADD COLUMN IF NOT EXISTS source_resource_id UUID,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

COMMENT ON COLUMN public.notifications.user_id IS
  'Recipient user (auth.users). Same as recipient_user_id in architecture docs.';
COMMENT ON COLUMN public.notifications.data IS
  'Display-safe JSON payload / deep-link metadata; not the clinical system of record.';
COMMENT ON COLUMN public.notifications.body IS
  'Full in-app body when needed; prefer minimal body_preview for lists/push/email previews.';
COMMENT ON COLUMN public.notifications.tenant_id IS
  'Legacy string tenant hint; prefer scope_tenant_id (UUID) for new rows.';

-- Backfill scope_type (required for CHECK)
UPDATE public.notifications
SET scope_type = 'tenant'
WHERE scope_type IS NULL
  AND tenant_id IS NOT NULL
  AND trim(tenant_id::text) <> '';

UPDATE public.notifications
SET scope_type = 'professional_personal'
WHERE scope_type IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'tenant';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_scope_type_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_scope_type_check CHECK (
        scope_type IN ('personal_health', 'professional_personal', 'tenant')
      );
  END IF;
END $$;

-- Backfill scope_tenant_id from legacy tenant_id when it is a UUID string
UPDATE public.notifications
SET scope_tenant_id = trim(tenant_id::text)::uuid
WHERE scope_tenant_id IS NULL
  AND tenant_id IS NOT NULL
  AND trim(tenant_id::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- workspace_kind defaults to scope_type for existing rows
UPDATE public.notifications
SET workspace_kind = scope_type
WHERE workspace_kind IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN workspace_kind SET DEFAULT 'tenant';

UPDATE public.notifications
SET workspace_kind = scope_type
WHERE workspace_kind IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN workspace_kind SET NOT NULL;

-- Short preview for list views (data minimization)
UPDATE public.notifications
SET body_preview = left(body, 280)
WHERE body_preview IS NULL AND body IS NOT NULL;

-- Derive status from read_at
UPDATE public.notifications SET status = 'read' WHERE status IS NULL AND read_at IS NOT NULL;
UPDATE public.notifications SET status = 'unread' WHERE status IS NULL;

ALTER TABLE public.notifications
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'unread';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_status_check'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_status_check CHECK (
        status IN ('unread', 'read', 'archived')
      );
  END IF;
END $$;

-- Optional FKs (requires Option C: public.tenants, public.user_tenants)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_scope_tenant_id_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_scope_tenant_id_fkey
      FOREIGN KEY (scope_tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_tenants'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_scope_membership_id_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_scope_membership_id_fkey
      FOREIGN KEY (scope_membership_id) REFERENCES public.user_tenants(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notifications_created_by_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_created_by_user_id_fkey
      FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_scope_tenant_id
  ON public.notifications(scope_tenant_id)
  WHERE scope_tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_scope_membership_id
  ON public.notifications(scope_membership_id)
  WHERE scope_membership_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_event_type
  ON public.notifications(event_type)
  WHERE event_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON public.notifications(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at
  ON public.notifications(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_key_unique
  ON public.notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Delivery attempts (audit / retries)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT notification_deliveries_channel_check CHECK (
    channel IN ('in_app', 'email', 'sms', 'push', 'websocket', 'other')
  ),
  CONSTRAINT notification_deliveries_status_check CHECK (
    status IN ('queued', 'sent', 'delivered', 'failed', 'suppressed')
  )
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id
  ON public.notification_deliveries(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_attempted_at
  ON public.notification_deliveries(attempted_at DESC);

COMMENT ON TABLE public.notification_deliveries IS
  'Per-channel send attempts for auditing, retries, and provider correlation.';

-- ---------------------------------------------------------------------------
-- 3. User preferences (category × channel)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  channel TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  mute_sensitive_previews BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notification_preferences_channel_check CHECK (
    channel IN ('in_app', 'email', 'sms', 'push', 'all')
  ),
  CONSTRAINT notification_preferences_user_category_channel_key UNIQUE (user_id, category, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id
  ON public.notification_preferences(user_id);

COMMENT ON TABLE public.notification_preferences IS
  'Per-user notification channel/category toggles and quiet hours.';

COMMIT;
