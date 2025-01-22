-- Add default roles
INSERT INTO public.roles (name, description) 
VALUES 
    ('patient', 'Patient with basic access'),
    ('doctor', 'Medical professional with patient management access'),
    ('pharmacist', 'Pharmacy staff with medication management access'),
    ('superadmin', 'Full system access and management capabilities')
ON CONFLICT (name) DO NOTHING;