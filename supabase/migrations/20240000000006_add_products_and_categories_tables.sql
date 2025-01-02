-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('medication', 'parapharmacy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subcategories table with foreign key to categories
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    type TEXT NOT NULL CHECK (type IN ('medication', 'parapharmacy')),
    requires_prescription BOOLEAN DEFAULT false,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    subcategory_id UUID REFERENCES public.subcategories(id),
    popularity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

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

-- Insert sample data for categories with proper UUIDs
DO $$
DECLARE
    pain_relief_id UUID;
    antibiotics_id UUID;
    vitamins_id UUID;
    skincare_id UUID;
    painkillers_id UUID;
    antiinflam_id UUID;
    broad_spectrum_id UUID;
    multivitamins_id UUID;
    face_care_id UUID;
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

    -- Insert sample products
    INSERT INTO public.products (
        name,
        description,
        price,
        type,
        requires_prescription,
        pharmacy_id,
        category_id,
        subcategory_id,
        image_url
    ) VALUES
    (
        'Ibuprofen 400mg',
        'Effective pain relief for headaches and mild pain',
        12.99,
        'medication',
        false,
        '1067588497',
        pain_relief_id,
        painkillers_id,
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    ),
    (
        'Amoxicillin 500mg',
        'Broad-spectrum antibiotic for bacterial infections',
        24.99,
        'medication',
        true,
        '1067588497',
        antibiotics_id,
        broad_spectrum_id,
        'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    ),
    (
        'Vitamin D3 1000IU',
        'Daily supplement for bone health',
        15.99,
        'parapharmacy',
        false,
        '1067588497',
        vitamins_id,
        multivitamins_id,
        'https://images.unsplash.com/photo-1577401132921-cb39bb0adcff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    ),
    (
        'Hydrating Face Cream',
        'Daily moisturizer for all skin types',
        29.99,
        'parapharmacy',
        false,
        '1067588497',
        skincare_id,
        face_care_id,
        'https://images.unsplash.com/photo-1556229162-5c63ed9c4efb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    );
END $$;