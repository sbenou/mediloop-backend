// User table in public schema (authentication & authorization)
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  password_hash?: string;
  role: string;
  role_id?: string;
  status: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

// Profile table in tenant schemas (extended profile data)
export interface Profile {
  id: string;
  user_id: string; // References auth.users.id
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  company?: string;
  job_title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  last_used?: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}
