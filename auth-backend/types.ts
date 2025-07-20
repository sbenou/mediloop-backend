export interface Profile {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: string;
  tenant_id?: string;
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