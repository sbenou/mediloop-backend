-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- Add RLS policies
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only superadmin can manage role permissions
-- Only superadmin can manage role permissions
CREATE POLICY "Enable all actions for superadmin users" ON public.role_permissions
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = (
             SELECT id FROM public.roles WHERE name = 'superadmin'
        )
    ));

-- Everyone can view role permissions
CREATE POLICY "Enable read access for all users" ON public.role_permissions
    FOR SELECT
    TO authenticated
    USING (true);