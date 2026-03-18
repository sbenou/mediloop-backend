// **Purpose:** Authentication & authorization types

// User account
export interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  full_name: string;
  role: string;
  role_id: string;
  status: "active" | "inactive" | "suspended";
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// Session management
export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  last_used?: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

// **Sources:**
// - `/UPDATED_types.ts` (User, Session)
// - New: DTOs, enums
