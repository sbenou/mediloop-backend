CREATE TABLE IF NOT EXISTS public.plan_marketing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('feature', 'service')),
  label TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'card' CHECK (
    visibility IN ('card', 'expandable', 'comparison_only')
  ),
  locale VARCHAR(16) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_marketing_items_plan_order_idx
  ON public.plan_marketing_items (plan_id, sort_order);

CREATE INDEX IF NOT EXISTS plan_marketing_items_plan_kind_idx
  ON public.plan_marketing_items (plan_id, kind);

CREATE UNIQUE INDEX IF NOT EXISTS plan_marketing_items_dedupe_idx
  ON public.plan_marketing_items (plan_id, kind, label, locale);
