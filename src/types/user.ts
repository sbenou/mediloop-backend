
import { Profile } from './supabase';
import type { Database } from '@/integrations/supabase/types';

// Define base types from Database
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbRolePermission = Database['public']['Tables']['role_permissions']['Row'];

// Create a base profile type that includes all fields from DbProfile
type BaseProfile = {
  [K in keyof DbProfile]: DbProfile[K];
};

// Extend the Profile type with proper typing, maintaining required fields
export interface UserProfile extends BaseProfile {
  role: string; // This is required
  // Additional fields that may be undefined
  role_id: DbProfile['role_id'];
  full_name: DbProfile['full_name'];
  email: DbProfile['email'];
  avatar_url: DbProfile['avatar_url'];
  date_of_birth: DbProfile['date_of_birth'];
  city: DbProfile['city'];
  auth_method: DbProfile['auth_method'];
  is_blocked: DbProfile['is_blocked'];
  doctor_stamp_url: DbProfile['doctor_stamp_url'];
  doctor_signature_url: DbProfile['doctor_signature_url'];
  cns_card_front: DbProfile['cns_card_front'];
  cns_card_back: DbProfile['cns_card_back'];
  cns_number: DbProfile['cns_number'];
  deleted_at: DbProfile['deleted_at'];
  created_at: DbProfile['created_at'];
  updated_at: DbProfile['updated_at'];
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  profile?: UserProfile;
}

// Type guard to check if a query result is an error
export function isQueryError(result: any): result is { error: true } {
  return result?.error === true;
}

// Helper to safely cast database results
export function safeQueryResult<T>(result: any): T | null {
  if (isQueryError(result)) {
    return null;
  }
  return result as T;
}
