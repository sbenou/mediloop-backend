-- =============================================================================
-- Re-seed permission catalog + default role_permissions (idempotent)
-- =============================================================================
-- Uses WHERE NOT EXISTS (not ON CONFLICT) so it works even when
-- public.role_permissions has no UNIQUE(role_id, permission_id) — some DBs only
-- have a surrogate primary key on id.
--
-- Run:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/sql/seed_permissions_and_role_permissions.sql
-- =============================================================================

INSERT INTO public.permissions (id, name, description)
SELECT v.id, v.name, v.description
FROM (
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
) AS v(id, name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.permissions p WHERE p.id = v.id);

DO $$
DECLARE
  superadmin_id UUID;
  admin_id UUID;
  doctor_id UUID;
  pharmacist_id UUID;
  patient_id UUID;
BEGIN
  SELECT id INTO superadmin_id FROM public.roles WHERE name = 'superadmin' LIMIT 1;
  SELECT id INTO admin_id FROM public.roles WHERE name = 'admin' LIMIT 1;
  SELECT id INTO doctor_id FROM public.roles WHERE name = 'doctor' LIMIT 1;
  SELECT id INTO pharmacist_id FROM public.roles WHERE name = 'pharmacist' LIMIT 1;
  SELECT id INTO patient_id FROM public.roles WHERE name = 'patient' LIMIT 1;

  IF superadmin_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT superadmin_id, p.id, timezone('utc', now())
    FROM public.permissions p
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      WHERE rp.role_id = superadmin_id
        AND rp.permission_id = p.id
    );
  END IF;

  IF admin_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT admin_id, p.id, timezone('utc', now())
    FROM public.permissions p
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      WHERE rp.role_id = admin_id
        AND rp.permission_id = p.id
    );
  END IF;

  IF doctor_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT doctor_id, p.id, timezone('utc', now())
    FROM public.permissions p
    WHERE p.id IN (
      'view_dashboard',
      'view_prescriptions',
      'manage_prescriptions',
      'view_settings'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        WHERE rp.role_id = doctor_id
          AND rp.permission_id = p.id
      );
  END IF;

  IF pharmacist_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT pharmacist_id, p.id, timezone('utc', now())
    FROM public.permissions p
    WHERE p.id IN (
      'view_dashboard',
      'view_products',
      'edit_products',
      'view_prescriptions',
      'manage_prescriptions',
      'view_settings'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        WHERE rp.role_id = pharmacist_id
          AND rp.permission_id = p.id
      );
  END IF;

  IF patient_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id, created_at)
    SELECT patient_id, p.id, timezone('utc', now())
    FROM public.permissions p
    WHERE p.id IN (
      'view_dashboard',
      'view_products',
      'view_orders',
      'view_prescriptions',
      'view_settings'
    )
      AND NOT EXISTS (
        SELECT 1
        FROM public.role_permissions rp
        WHERE rp.role_id = patient_id
          AND rp.permission_id = p.id
      );
  END IF;
END $$;
