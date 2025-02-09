DROP TABLE IF EXISTS public.role_permissions CASCADE;

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (role_id, permission_id)  -- Prevent duplicate role-permission pairs
);

-- Add RLS policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only superadmin can manage role permissions
CREATE POLICY "Enable all actions for superadmin users" ON public.role_permissions
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.role::text = (
             SELECT id::text FROM public.roles WHERE name = 'superadmin'
        )
    ));

-- Everyone can view role permissions
CREATE POLICY "Enable read access for all users" ON public.role_permissions
    FOR SELECT
    TO authenticated
    USING (true);