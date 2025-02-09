-- Add RLS policies

DROP POLICY IF EXISTS "Enable read access for all users" ON public.roles;

-- Everyone can view roles
CREATE POLICY "Enable read access for all users"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role UUID NOT NULL REFERENCES public.roles(id),
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    license_number TEXT UNIQUE,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all actions for superadmin users" ON public.roles;

-- Only superadmin can manage roles
CREATE POLICY "Enable all actions for superadmin users"
ON public.roles
FOR ALL
TO authenticated
USING (
    current_user = 'postgres' OR
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id::text = auth.uid()::text
          AND profiles.role = (
              SELECT id
              FROM public.roles
              WHERE name = 'superadmin'
          )
    )
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP TYPE IF EXISTS prescription_status CASCADE;

-- Create the prescription_status enum type
CREATE TYPE prescription_status AS ENUM ('draft', 'active', 'completed');

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id),
    patient_id UUID NOT NULL REFERENCES public.profiles(id),
    medication_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    notes TEXT,
    status prescription_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
