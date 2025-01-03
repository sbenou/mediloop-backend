-- Disable triggers temporarily to avoid trigger-related issues
SET session_replication_role = 'replica';

-- Truncate all tables in the correct order (respecting foreign key constraints)
TRUNCATE TABLE 
    doctor_patient_connections,
    addresses,
    profiles
CASCADE;

-- Also clean up auth.users table
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset all sequences
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;