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

-- Insert sample data
INSERT INTO public.categories (name, type) VALUES
    ('Pain Relief', 'medication'),
    ('Antibiotics', 'medication'),
    ('Vitamins', 'parapharmacy'),
    ('Skincare', 'parapharmacy')
ON CONFLICT DO NOTHING;

-- Insert sample subcategories
INSERT INTO public.subcategories (name, category_id)
SELECT 'Painkillers', id FROM public.categories WHERE name = 'Pain Relief'
ON CONFLICT DO NOTHING;

INSERT INTO public.subcategories (name, category_id)
SELECT 'Anti-inflammatory', id FROM public.categories WHERE name = 'Pain Relief'
ON CONFLICT DO NOTHING;

INSERT INTO public.subcategories (name, category_id)
SELECT 'Broad Spectrum', id FROM public.categories WHERE name = 'Antibiotics'
ON CONFLICT DO NOTHING;

INSERT INTO public.subcategories (name, category_id)
SELECT 'Multivitamins', id FROM public.categories WHERE name = 'Vitamins'
ON CONFLICT DO NOTHING;

INSERT INTO public.subcategories (name, category_id)
SELECT 'Face Care', id FROM public.categories WHERE name = 'Skincare'
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO public.products (name, description, price, type, requires_prescription, category_id, subcategory_id)
SELECT 
    'Sample Product 1',
    'This is a sample product description',
    9.99,
    c.type,
    CASE WHEN c.type = 'medication' THEN true ELSE false END,
    c.id,
    s.id
FROM public.categories c
JOIN public.subcategories s ON s.category_id = c.id
LIMIT 1;