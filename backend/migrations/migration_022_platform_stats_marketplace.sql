-- Support homepage / marketing platform-stats: orders, endorsed pharmacies, and ensure orders exists on fresh Neon.
-- Prescriptions, teleconsultations, and connections remain authoritative in Postgres (HDS path).

BEGIN;

-- Pharmacies: ensure table + endorsed flag (payments / partner flows).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pharmacies'
  ) THEN
    CREATE TABLE public.pharmacies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      postal_code TEXT NOT NULL DEFAULT '',
      phone TEXT,
      hours TEXT,
      endorsed BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    ALTER TABLE public.pharmacies
      ADD COLUMN IF NOT EXISTS endorsed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Cart / checkout counts: create only when the legacy Supabase migration was never applied.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    CREATE TABLE public.orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      total NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at);
  END IF;
END $$;

COMMIT;
