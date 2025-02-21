
import { Profile } from './supabase';
import type { Database } from '@/integrations/supabase/types';

// Define base types from Database
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbRolePermission = Database['public']['Tables']['role_permissions']['Row'];

// Extend the Profile type with proper typing
export interface UserProfile extends DbProfile {
  role: string;
  role_id?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  date_of_birth?: string;
  city?: string;
  auth_method?: string;
  is_blocked?: boolean;
  doctor_stamp_url?: string;
  doctor_signature_url?: string;
  cns_card_front?: string;
  cns_card_back?: string;
  cns_number?: string;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
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
