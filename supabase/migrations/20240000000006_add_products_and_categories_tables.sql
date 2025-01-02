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

-- Insert sample data for categories
INSERT INTO public.categories (id, name, type) VALUES
    ('c1', 'Pain Relief', 'medication'),
    ('c2', 'Antibiotics', 'medication'),
    ('c3', 'Vitamins', 'parapharmacy'),
    ('c4', 'Skincare', 'parapharmacy')
ON CONFLICT DO NOTHING;

-- Insert sample subcategories with explicit IDs
INSERT INTO public.subcategories (id, name, category_id) VALUES
    ('s1', 'Painkillers', 'c1'),
    ('s2', 'Anti-inflammatory', 'c1'),
    ('s3', 'Broad Spectrum', 'c2'),
    ('s4', 'Multivitamins', 'c3'),
    ('s5', 'Face Care', 'c4')
ON CONFLICT DO NOTHING;

-- Insert sample products with explicit pharmacy_id
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
        'c1',
        's1',
        'https://placehold.co/400x400'
    ),
    (
        'Amoxicillin 500mg',
        'Broad-spectrum antibiotic for bacterial infections',
        24.99,
        'medication',
        true,
        '1067588497',
        'c2',
        's3',
        'https://placehold.co/400x400'
    ),
    (
        'Vitamin D3 1000IU',
        'Daily supplement for bone health',
        15.99,
        'parapharmacy',
        false,
        '1067588497',
        'c3',
        's4',
        'https://placehold.co/400x400'
    ),
    (
        'Hydrating Face Cream',
        'Daily moisturizer for all skin types',
        29.99,
        'parapharmacy',
        false,
        '1067588497',
        'c4',
        's5',
        'https://placehold.co/400x400'
    );