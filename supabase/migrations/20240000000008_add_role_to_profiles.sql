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

-- Add check constraint to limit possible roles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE profiles
ADD CONSTRAINT valid_role 
CHECK (role IN ('user', 'doctor', 'pharmacist', 'superadmin'));

-- Update existing rows to have 'user' role if null
UPDATE profiles 
SET role = 'user' 
WHERE role IS NULL;