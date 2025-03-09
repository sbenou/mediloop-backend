
// Define the authentication roles
export enum AuthRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  PHARMACIST = 'pharmacist',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

// Authentication-related types
export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at?: string;
  app_metadata: {
    provider?: string;
    [key: string]: any;
  };
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    role?: AuthRole;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}
