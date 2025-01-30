DO $$
DECLARE
    superadmin_role_id UUID;
    doctor_role_id UUID;
    pharmacist_role_id UUID;
    patient_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO superadmin_role_id FROM public.roles WHERE name = 'superadmin';
    IF superadmin_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "superadmin" does not exist in the roles table.';
    END IF;

    SELECT id INTO doctor_role_id FROM public.roles WHERE name = 'doctor';
    IF doctor_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "doctor" does not exist in the roles table.';
    END IF;

    SELECT id INTO pharmacist_role_id FROM public.roles WHERE name = 'pharmacist';
    IF pharmacist_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "pharmacist" does not exist in the roles table.';
    END IF;

    SELECT id INTO patient_role_id FROM public.roles WHERE name = 'patient';
    IF patient_role_id IS NULL THEN
        RAISE EXCEPTION 'Role "patient" does not exist in the roles table.';
    END IF;

    -- Superadmin gets all permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT 
        superadmin_role_id,
        unnest(ARRAY[
            'view_dashboard', 'manage_dashboard',
            'view_products', 'create_products', 'edit_products', 'delete_products',
            'view_orders', 'manage_orders',
            'view_prescriptions', 'manage_prescriptions',
            'view_settings', 'manage_settings',
            'view_admin', 'manage_roles', 'manage_users'
        ]),
        TIMEZONE('utc', NOW());

    -- Doctor gets relevant permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT 
        doctor_role_id,
        unnest(ARRAY[
            'view_dashboard',
            'view_prescriptions', 'manage_prescriptions',
            'view_settings'
        ]),
        TIMEZONE('utc', NOW());

    -- Pharmacist gets relevant permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT 
        pharmacist_role_id,
        unnest(ARRAY[
            'view_dashboard',
            'view_products', 'edit_products',
            'view_prescriptions', 'manage_prescriptions',
            'view_settings'
        ]),
        TIMEZONE('utc', NOW());

    -- Regular user gets basic permissions
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT 
        patient_role_id,
        unnest(ARRAY[
            'view_dashboard',
            'view_products',
            'view_orders',
            'view_prescriptions',
            'view_settings'
        ]),
        TIMEZONE('utc', NOW());
END $$;
