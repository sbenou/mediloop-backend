-- ============================================================================
-- MEDILOOP AUTH SCHEMA
-- Multi-tenant PostgreSQL schema for Neon database
-- ============================================================================

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- ============================================================================
-- PUBLIC SCHEMA - Roles and Multi-tenant tables
-- ============================================================================

-- Create roles table (in public schema)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTH SCHEMA - User authentication tables
-- ============================================================================

-- Create users table
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES public.roles(id),
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
  tenant_type VARCHAR(32),
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
  status VARCHAR(32) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'revoked', 'left')),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_is_primary ON public.user_tenants(user_id, is_primary);

-- Personal-health tenant mapping (one per user; see Option C doc)
CREATE TABLE IF NOT EXISTS public.personal_health_tenants (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_health_tenants_tenant
  ON public.personal_health_tenants(tenant_id);

-- Tenant invitations (pending flow; not the same as user_tenants)
CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  token_hash TEXT NOT NULL,
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_tenant_email
  ON public.tenant_invitations(tenant_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status
  ON public.tenant_invitations(tenant_id, status);

-- Structured audit events (Option C)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  membership_id UUID REFERENCES public.user_tenants(id) ON DELETE SET NULL,
  role VARCHAR(50),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  target_patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_patient_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('success', 'denied', 'error')),
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_occurred_at ON public.audit_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON public.audit_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_id ON public.audit_events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON public.audit_events(action, occurred_at DESC);

-- ============================================================================
-- SEED DATA - Default roles
-- ============================================================================

-- Insert default roles (if not exists)
INSERT INTO public.roles (id, name, description) VALUES
  ('b138db82-5a93-42e1-b015-f125e3067f35', 'doctor', 'Healthcare professional - doctor'),
  ('6fe5150a-3d29-4e9c-ae83-ec4b53df0a5e', 'nurse', 'Healthcare professional - nurse'),
  ('a4c71baa-9f3a-4aa4-b9e9-1c5e8e7d4f2a', 'pharmacist', 'Pharmacy professional'),
  ('fd22ce52-4ad1-44f6-9558-08ca515dede4', 'patient', 'Patient user'),
  ('e8d3c5b1-7a4f-4e9c-9f8e-2d6b5c3a1f0e', 'admin', 'System administrator')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
