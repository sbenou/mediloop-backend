-- Create pharmacies table
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT,
    hours TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_pharmacies table for default pharmacy selection
CREATE TABLE IF NOT EXISTS public.user_pharmacies (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (user_id)
);

-- Add RLS policies
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_pharmacies ENABLE ROW LEVEL SECURITY;

-- Policies for pharmacies
CREATE POLICY "Pharmacies are viewable by all authenticated users"
    ON public.pharmacies
    FOR SELECT
    TO authenticated
    USING (true);

-- Policies for user_pharmacies
CREATE POLICY "Users can view their own pharmacy selection"
    ON public.user_pharmacies
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pharmacy selection"
    ON public.user_pharmacies
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pharmacy selection"
    ON public.user_pharmacies
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pharmacy selection"
    ON public.user_pharmacies
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);