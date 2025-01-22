-- First drop the existing constraints if they exist
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_role;

-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' 
                  AND column_name = 'role') THEN
        ALTER TABLE profiles 
        ADD COLUMN role text DEFAULT 'user';
    END IF;
END $$;

-- Update any existing rows with invalid or NULL roles to 'user'
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL OR role NOT IN ('user', 'doctor', 'pharmacist', 'superadmin');

-- Add new check constraint to limit possible roles
ALTER TABLE profiles
ADD CONSTRAINT valid_role 
CHECK (role IN ('user', 'doctor', 'pharmacist', 'superadmin'));