
-- Add pharmacist stamp and signature fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pharmacist_stamp_url TEXT,
ADD COLUMN IF NOT EXISTS pharmacist_signature_url TEXT;
