-- Add default roles
-- INSERT INTO public.roles (name, description) 
-- VALUES 
--     ('patient', 'Patient with basic access'),
--     ('doctor', 'Medical professional with patient management access'),
--     ('pharmacist', 'Pharmacy staff with medication management access'),
--     ('superadmin', 'Full system access and management capabilities')
-- ON CONFLICT (name) DO NOTHING;

-- Seed the `roles` table
INSERT INTO public.roles (id, name, description) VALUES
    (gen_random_uuid(), 'patient', 'Patient with basic access'),
    (gen_random_uuid(), 'doctor', 'Doctor with special access'),
    (gen_random_uuid(), 'pharmacist', 'Pharmacist with specific permissions'),
    (gen_random_uuid(), 'superadmin', 'Super administrator with full access')
ON CONFLICT (name) DO NOTHING;