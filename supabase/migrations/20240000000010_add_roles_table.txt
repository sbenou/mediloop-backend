-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add default roles
INSERT INTO public.roles (name, description) 
VALUES 
    ('user', 'Regular user with basic access'),
    ('doctor', 'Medical professional with patient management access'),
    ('pharmacist', 'Pharmacy staff with medication management access'),
    ('superadmin', 'Full system access and management capabilities')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Only superadmin can manage roles
CREATE POLICY "Enable all actions for superadmin users" ON public.roles
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'superadmin'
    ));

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