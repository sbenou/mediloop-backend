-- Disable triggers temporarily to avoid trigger-related issues
SET session_replication_role = 'replica';

-- Truncate all tables in the correct order (respecting foreign key constraints)
TRUNCATE TABLE 
    doctor_patient_connections,
    addresses,
    profiles
CASCADE;

-- Clean up all auth-related tables
DELETE FROM auth.users;
DELETE FROM auth.identities;
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.flow_state;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Reset all sequences
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;