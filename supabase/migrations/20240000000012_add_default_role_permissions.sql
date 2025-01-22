DO $$
DECLARE
    superadmin_role_id UUID;
    doctor_role_id UUID;
    pharmacist_role_id UUID;
    patient_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO superadmin_role_id FROM public.roles WHERE name = 'superadmin';
    SELECT id INTO doctor_role_id FROM public.roles WHERE name = 'doctor';
    SELECT id INTO pharmacist_role_id FROM public.roles WHERE name = 'pharmacist';
    SELECT id INTO patient_role_id FROM public.roles WHERE name = 'patient';

    -- Superadmin gets all permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT 
        superadmin_role_id,
        unnest(ARRAY[
            'view_dashboard', 'manage_dashboard',
            'view_products', 'create_products', 'edit_products', 'delete_products',
            'view_orders', 'manage_orders',
            'view_prescriptions', 'manage_prescriptions',
            'view_settings', 'manage_settings',
            'view_admin', 'manage_roles', 'manage_users'
        ]);

    -- Doctor gets relevant permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT 
        doctor_role_id,
        unnest(ARRAY[
            'view_dashboard',
            'view_prescriptions', 'manage_prescriptions',
            'view_settings'
        ]);

    -- Pharmacist gets relevant permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT 
        pharmacist_role_id,
        unnest(ARRAY[
            'view_dashboard',
            'view_products', 'edit_products',
            'view_prescriptions', 'manage_prescriptions',
            'view_settings'
        ]);

    -- Regular user gets basic permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT 
        patient_role_id,
        unnest(ARRAY[
            'view_dashboard',
            'view_products',
            'view_orders',
            'view_prescriptions',
            'view_settings'
        ]);
END $$;
