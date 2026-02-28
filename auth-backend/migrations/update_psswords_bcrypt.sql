-- ============================================
-- BCRYPT PASSWORD UPDATE SCRIPT
-- ============================================
-- Run this after updating passwordService.ts to bcrypt
--
-- Password for ALL test users: TestPassword123!
--
-- INSTRUCTIONS:
-- 1. Generate the hash first (see command below)
-- 2. Replace 'PASTE_BCRYPT_HASH_HERE' with actual hash
-- 3. Run this SQL in your Neon database
-- ============================================

-- STEP 1: Generate the hash with this command:
-- cd ~/mediloop-backend/auth-backend
-- deno eval 'import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"; const hash = await bcrypt.hash("TestPassword123!"); console.log(hash);'

-- STEP 2: Update all test users with the generated hash
UPDATE auth.users 
SET password_hash = '$2a$10$7Q9hy6dyX7yCzwqtzM393.l9L9tCaPl291.WccLk.6PJRtxjeHrge'
WHERE email IN (
  'newdoctor@test.com',
  'testdoctor@clinic.com',
  'doctor2@clinic.com',
  'test@example.com',
  'nurse@clinic.com'
);

-- STEP 3: Verify the updates
SELECT 
  email, 
  full_name, 
  role,
  substring(password_hash, 1, 7) as hash_type,
  length(password_hash) as hash_length
FROM auth.users
ORDER BY email;

-- Hash should start with '$2a$10$' or '$2b$10$' and be 60 characters
