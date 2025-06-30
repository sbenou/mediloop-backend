
-- Fix constraint syntax (PostgreSQL doesn't support IF NOT EXISTS for constraints)
DO $$
BEGIN
    -- Add valid_role constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'valid_role' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT valid_role 
        CHECK (role IN ('patient', 'doctor', 'pharmacist', 'pharmacy_staff', 'superadmin'));
    END IF;
    
    -- Add foreign key constraint for tenant_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_profiles_tenant' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT fk_profiles_tenant 
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Verify the setup by checking if our core tables exist
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 
    'roles' as table_name, COUNT(*) as row_count FROM roles
UNION ALL
SELECT 
    'permissions' as table_name, COUNT(*) as row_count FROM permissions;
