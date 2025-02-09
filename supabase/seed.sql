-- Insert roles before profiles
INSERT INTO public.roles (id, name, description) VALUES
    (gen_random_uuid(), 'patient', 'Patient with basic access'),
    (gen_random_uuid(), 'doctor', 'Doctor with special access'),
    (gen_random_uuid(), 'pharmacist', 'Pharmacist with specific permissions'),
    (gen_random_uuid(), 'superadmin', 'Super administrator with full access')
ON CONFLICT (name) DO NOTHING;

-- -- Insert Superadmin Profile
-- INSERT INTO public.profiles (id, role, full_name, email)
-- VALUES (
--     gen_random_uuid(),
--     (SELECT id FROM public.roles WHERE name = 'superadmin'),
--     'Super Admin',
--     'sbenou@hotmail.com'
-- );

-- Insert Permissions into the permissions table
INSERT INTO public.permissions (id, name, description)
VALUES
    ('view_dashboard', 'View Dashboard', 'Can view the dashboard'),
    ('manage_dashboard', 'Manage Dashboard', 'Can manage dashboard settings'),
    ('view_products', 'View Products', 'Can view products'),
    ('create_products', 'Create Products', 'Can create new products'),
    ('edit_products', 'Edit Products', 'Can edit existing products'),
    ('delete_products', 'Delete Products', 'Can delete products'),
    ('view_orders', 'View Orders', 'Can view orders'),
    ('manage_orders', 'Manage Orders', 'Can manage orders'),
    ('view_prescriptions', 'View Prescriptions', 'Can view prescriptions'),
    ('manage_prescriptions', 'Manage Prescriptions', 'Can manage prescriptions'),
    ('view_settings', 'View Settings', 'Can access settings'),
    ('manage_settings', 'Manage Settings', 'Can modify settings'),
    ('view_admin', 'View Admin', 'Can access admin panel'),
    ('manage_roles', 'Manage Roles', 'Can manage roles and permissions'),
    ('manage_users', 'Manage Users', 'Can manage user accounts')
ON CONFLICT (id) DO NOTHING;


DO $$
DECLARE
    superadmin_role_id UUID;
    doctor_role_id UUID;
    pharmacist_role_id UUID;
    patient_role_id UUID;
BEGIN
    -- Fetch role IDs
    SELECT id INTO superadmin_role_id FROM public.roles WHERE name = 'superadmin';
    SELECT id INTO doctor_role_id FROM public.roles WHERE name = 'doctor';
    SELECT id INTO pharmacist_role_id FROM public.roles WHERE name = 'pharmacist';
    SELECT id INTO patient_role_id FROM public.roles WHERE name = 'patient';

    -- Superadmin: All permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT superadmin_role_id, id, TIMEZONE('utc', NOW())
    FROM public.permissions
    ON CONFLICT DO NOTHING;

    -- Doctor Permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT doctor_role_id, id, TIMEZONE('utc', NOW())
    FROM public.permissions
    WHERE id IN ('view_dashboard', 'view_prescriptions', 'manage_prescriptions', 'view_settings')
    ON CONFLICT DO NOTHING;

    -- Pharmacist Permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT pharmacist_role_id, id, TIMEZONE('utc', NOW())
    FROM public.permissions
    WHERE id IN ('view_dashboard', 'view_products', 'edit_products', 'view_prescriptions', 'manage_prescriptions', 'view_settings')
    ON CONFLICT DO NOTHING;

    -- Patient Permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT patient_role_id, id, TIMEZONE('utc', NOW())
    FROM public.permissions
    WHERE id IN ('view_dashboard', 'view_products', 'view_orders', 'view_prescriptions', 'view_settings')
    ON CONFLICT DO NOTHING;
END $$;
