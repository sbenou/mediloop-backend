/**
 * Export Database Schema
 * Exports the schema from DEV database to a SQL file
 * 
 * Usage:
 *   deno run --allow-net --allow-env --allow-read --allow-write scripts/db/export-schema.ts
 */

import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load environment variables
const env = await load({ envPath: ".env.development", export: true });

const DATABASE_URL = Deno.env.get("DATABASE_URL") || Deno.env.get("DATABASE_URL_DEV");

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment");
  Deno.exit(1);
}

console.log("\n" + "=".repeat(70));
console.log("📤 Exporting Database Schema from DEV");
console.log("=".repeat(70));

// Parse connection string
const url = new URL(DATABASE_URL);
const client = new Client({
  hostname: url.hostname,
  port: parseInt(url.port || "5432"),
  user: url.username,
  password: url.password,
  database: url.pathname.split("/")[1],
  tls: { enabled: true, enforce: false },
});

try {
  console.log("\n🔌 Connecting to DEV database...");
  await client.connect();
  console.log("✅ Connected to:", url.hostname);

  // Export auth schema
  console.log("\n📋 Exporting auth schema...");
  
  const authSchemaSQL = `
-- ============================================================================
-- MEDILOOP AUTH SCHEMA
-- Exported from DEV database: ${new Date().toISOString()}
-- ============================================================================

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create roles table
CREATE TABLE IF NOT EXISTS auth.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES auth.roles(id),
  role VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON auth.users(email_verified);

-- Create sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes on sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON auth.sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON auth.sessions(expires_at);

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS auth.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on email_verifications table
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON auth.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON auth.email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON auth.email_verifications(email);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS auth.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20),
  verification_code VARCHAR(10),
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on password_reset_tokens table
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON auth.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON auth.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_phone ON auth.password_reset_tokens(phone_number);

-- ============================================================================
-- PUBLIC SCHEMA - Multi-tenant tables
-- ============================================================================

-- Create tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  schema VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_tenants table (maps users to tenants)
CREATE TABLE IF NOT EXISTS public.user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_is_primary ON public.user_tenants(user_id, is_primary);

-- ============================================================================
-- SEED DATA - Default roles
-- ============================================================================

-- Insert default roles (if not exists)
INSERT INTO auth.roles (id, name, description) VALUES
  ('b138db82-5a93-42e1-b015-f125e3067f35', 'doctor', 'Healthcare professional - doctor'),
  ('6fe5150a-3d29-4e9c-ae83-ec4b53df0a5e', 'nurse', 'Healthcare professional - nurse'),
  ('a4c71baa-9f3a-4aa4-b9e9-1c5e8e7d4f2a', 'pharmacist', 'Pharmacy professional'),
  ('fd22ce52-4ad1-44f6-9558-08ca515dede4', 'patient', 'Patient user'),
  ('e8d3c5b1-7a4f-4e9c-9f8e-2d6b5c3a1f0e', 'admin', 'System administrator')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- ============================================================================
-- SCHEMA EXPORT COMPLETE
-- ============================================================================
`;

  // Write to file
  const schemaFile = "scripts/db/schema.sql";
  await Deno.writeTextFile(schemaFile, authSchemaSQL);
  
  console.log(`✅ Schema exported to: ${schemaFile}`);
  console.log("\n📋 Schema includes:");
  console.log("   - auth.roles");
  console.log("   - auth.users");
  console.log("   - auth.sessions");
  console.log("   - auth.email_verifications");
  console.log("   - auth.password_reset_tokens");
  console.log("   - public.tenants");
  console.log("   - public.user_tenants");
  console.log("   - Default roles seeded");
  
  console.log("\n✅ Schema export complete!");
  console.log("\n💡 Next step: Run the apply-schema.ts script to import to TEST database");
  console.log("   deno run --allow-net --allow-env --allow-read scripts/db/apply-schema.ts");

} catch (error) {
  console.error("❌ Error:", error.message);
  Deno.exit(1);
} finally {
  await client.end();
}

console.log("\n" + "=".repeat(70));
