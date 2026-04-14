-- ============================================================================
-- Marketplace product catalog (Neon) — replaces Supabase public.categories /
-- subcategories / products for storefront navigation and filters.
--
-- Apply on Neon after prior migrations. Empty tables are valid; seed or import
-- from Supabase (Table Editor → Export, or pg_dump) as needed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_categories_type ON public.catalog_categories (type);

CREATE TABLE IF NOT EXISTS public.catalog_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.catalog_categories (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_subcategories_category_id
  ON public.catalog_subcategories (category_id);

CREATE TABLE IF NOT EXISTS public.catalog_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.catalog_categories (id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.catalog_subcategories (id) ON DELETE SET NULL,
  pharmacy_id UUID REFERENCES public.pharmacies (id) ON DELETE SET NULL,
  name VARCHAR(512) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  type VARCHAR(64) NOT NULL DEFAULT 'medication',
  requires_prescription BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_products_subcategory_id ON public.catalog_products (subcategory_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category_id ON public.catalog_products (category_id);

COMMENT ON TABLE public.catalog_categories IS 'Marketplace medication / parapharmacy categories (frontend Medications nav)';
COMMENT ON TABLE public.catalog_subcategories IS 'Subcategories under catalog_categories';
COMMENT ON TABLE public.catalog_products IS 'Marketplace SKU rows; migrated from Supabase public.products';
