-- Workspace tables for pharmacist / doctor UIs (Neon). Safe on fresh or existing DBs.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_pharmacies (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, pharmacy_id)
);

CREATE INDEX IF NOT EXISTS idx_user_pharmacies_pharmacy_id
  ON public.user_pharmacies(pharmacy_id);

CREATE TABLE IF NOT EXISTS public.pharmacy_metadata (
  pharmacy_id UUID PRIMARY KEY REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doctor_metadata (
  doctor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  logo_url TEXT,
  hours TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pharmacies
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMIT;
