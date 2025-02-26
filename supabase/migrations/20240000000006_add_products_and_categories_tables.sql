
-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('medication', 'parapharmacy', 'wearable')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subcategories table with foreign key to categories
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create products table (without pharmacy_id)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('medication', 'parapharmacy', 'wearable')),
    requires_prescription BOOLEAN DEFAULT false,
    category_id UUID REFERENCES public.categories(id),
    subcategory_id UUID REFERENCES public.subcategories(id),
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Categories are viewable by all authenticated users" ON public.categories';
    EXECUTE 'DROP POLICY IF EXISTS "Subcategories are viewable by all authenticated users" ON public.subcategories';
    EXECUTE 'DROP POLICY IF EXISTS "Products are viewable by all authenticated users" ON public.products';
    EXECUTE 'DROP POLICY IF EXISTS "Superadmins can insert products" ON public.products';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Categories policies
CREATE POLICY "Categories are viewable by all authenticated users"
    ON public.categories FOR SELECT
    TO authenticated
    USING (true);

-- Subcategories policies
CREATE POLICY "Subcategories are viewable by all authenticated users"
    ON public.subcategories FOR SELECT
    TO authenticated
    USING (true);

-- Products policies
CREATE POLICY "Products are viewable by all authenticated users"
    ON public.products FOR SELECT
    TO authenticated
    USING (true);

-- Add new policy for superadmins to insert products
CREATE POLICY "Superadmins can insert products"
    ON public.products 
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.profiles
            WHERE profiles.id::text = auth.uid()::text
              AND profiles.role::text = (
                  SELECT id::text 
                  FROM public.roles 
                  WHERE name = 'superadmin'
              )
        )
    );

-- Insert sample data for categories
DO $$
DECLARE
    pain_relief_id UUID;
    antibiotics_id UUID;
    vitamins_id UUID;
    skincare_id UUID;
    wearables_id UUID;
    painkillers_id UUID;
    antiinflam_id UUID;
    broad_spectrum_id UUID;
    multivitamins_id UUID;
    face_care_id UUID;
    smartwatches_id UUID;
    fitness_trackers_id UUID;
    smart_rings_id UUID;
BEGIN
    -- Insert categories and store their IDs
    INSERT INTO public.categories (name, type) 
    VALUES ('Pain Relief', 'medication') 
    RETURNING id INTO pain_relief_id;
    
    INSERT INTO public.categories (name, type) 
    VALUES ('Antibiotics', 'medication') 
    RETURNING id INTO antibiotics_id;
    
    INSERT INTO public.categories (name, type) 
    VALUES ('Vitamins', 'parapharmacy') 
    RETURNING id INTO vitamins_id;
    
    INSERT INTO public.categories (name, type) 
    VALUES ('Skincare', 'parapharmacy') 
    RETURNING id INTO skincare_id;

    INSERT INTO public.categories (name, type) 
    VALUES ('Wearables', 'wearable') 
    RETURNING id INTO wearables_id;

    -- Insert subcategories using the category IDs
    INSERT INTO public.subcategories (name, category_id)
    VALUES ('Painkillers', pain_relief_id)
    RETURNING id INTO painkillers_id;

    INSERT INTO public.subcategories (name, category_id)
    VALUES ('Anti-inflammatory', pain_relief_id)
    RETURNING id INTO antiinflam_id;

    INSERT INTO public.subcategories (name, category_id)
    VALUES ('Broad Spectrum', antibiotics_id)
    RETURNING id INTO broad_spectrum_id;

    INSERT INTO public.subcategories (name, category_id)
    VALUES ('Multivitamins', vitamins_id)
    RETURNING id INTO multivitamins_id;

    INSERT INTO public.subcategories (name, category_id)
    VALUES ('Face Care', skincare_id)
    RETURNING id INTO face_care_id;
    
    INSERT INTO public