-- Update roles table to change 'user' to 'patient'
UPDATE public.roles
SET name = 'patient',
    description = 'Patient with basic access'
WHERE name = 'user';

-- Update profiles table to reflect the role change
UPDATE public.profiles
SET role = (SELECT id FROM public.roles WHERE name = 'patient')
WHERE role = (SELECT id FROM public.roles WHERE name = 'user');

-- Update the default role permissions migration
UPDATE public.role_permissions
SET role_id = (SELECT id FROM public.roles WHERE name = 'patient')
WHERE role_id = (SELECT id FROM public.roles WHERE name = 'user');

-- Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Everyone can view roles
CREATE POLICY "Enable read access for all users" ON public.roles
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

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create the profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role UUID NOT NULL REFERENCES public.roles(id), -- Enforce roles using FK
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    license_number TEXT UNIQUE,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Only superadmin can manage roles
CREATE POLICY "Enable all actions for superadmin users" ON public.roles
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    ));

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
