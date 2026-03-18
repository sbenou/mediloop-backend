// **Purpose:** Multi-tenancy & organization types

// Tenant schema
export interface Tenant {
  id: string;
  schema_name: string;
  name: string;
  domain?: string;
  created_at: Date;
  updated_at: Date;
}

// Profile (tenant-specific)
export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  job_title?: string;
  created_at: Date;
  updated_at: Date;
}

// Organization
export interface Organization {
  id: string;
  name: string;
  tenant_id: string;
  owner_id: string;
  settings?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Organization member
export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  invited_by?: string;
  joined_at: Date;
  created_at: Date;
}

// **Sources:**
// - `/UPDATED_types.ts` (Tenant, Profile)
// - `/backend-types-organization.ts`
// - `/backend-types-organizationMember.ts`
