-- Bank holidays for scheduling / calendars (Neon). Replaces Supabase-only table.

CREATE TABLE IF NOT EXISTS public.bank_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL CHECK (country IN ('Luxembourg', 'France')),
  holiday_name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country, holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_bank_holidays_country_date
  ON public.bank_holidays (country, holiday_date);
