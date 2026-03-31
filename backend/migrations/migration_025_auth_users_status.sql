-- Add status column to auth.users for account lifecycle management.
-- This matches existing application logic (see postgresService.validateCredentials/deleteUser).

ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

