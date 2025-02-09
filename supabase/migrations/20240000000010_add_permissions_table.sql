DROP TABLE IF EXISTS public.permissions CASCADE;

-- Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

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

    ('view_admin', 'View Admin Panel', 'Can access admin panel'),
    ('manage_roles', 'Manage Roles', 'Can manage roles and permissions'),
    ('manage_users', 'Manage Users', 'Can manage user accounts')
ON CONFLICT (id) DO NOTHING;
