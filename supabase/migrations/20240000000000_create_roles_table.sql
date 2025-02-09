-- Update roles table to change 'user' to 'patient'
-- UPDATE public.roles
-- SET name = 'patient',
--     description = 'Patient with basic access'
-- WHERE name = 'user';

-- Update profiles table to reflect the role change
-- UPDATE public.profiles
-- SET role = (SELECT id FROM public.roles WHERE name = 'patient')
-- WHERE role = (SELECT id FROM public.roles WHERE name = 'user');

-- -- Update the default role permissions migration
-- UPDATE public.role_permissions
-- SET role_id = (SELECT id FROM public.roles WHERE name = 'patient')
-- WHERE role_id = (SELECT id FROM public.roles WHERE name = 'user');

-- Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- INSERT INTO public.roles (id, name, description) VALUES
--     (gen_random_uuid(), 'patient', 'Patient with basic access'),
--     (gen_random_uuid(), 'doctor', 'Doctor with special access'),
--     (gen_random_uuid(), 'pharmacist', 'Pharmacist with specific permissions'),
--     (gen_random_uuid(), 'superadmin', 'Super administrator with full access')
-- ON CONFLICT (name) DO NOTHING;
