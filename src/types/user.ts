
import { Profile } from './supabase';
import type { Database } from '@/integrations/supabase/types';

// Define base types from Database
export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbRolePermission = Database['public']['Tables']['role_permissions']['Row'];

// Create a base profile type that includes all fields from DbProfile with proper null handling
export interface UserProfile extends Omit<DbProfile, 'id'> {
  id: string;
  role: string;
  role_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  auth_method?: string | null;
  is_blocked?: boolean | null;
  doctor_stamp_url?: string | null;
  doctor_signature_url?: string | null;
  cns_card_front?: string | null;
  cns_card_back?: string | null;
  cns_number?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  profile?: UserProfile;
}

// Type guard to check for Supabase errors
export function isSupabaseError(error: unknown): error is { message: string; details: string; hint?: string; code: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Helper to safely handle query results with proper type information
export function safeQueryResult<T>(result: T | null): T | null {
  if (!result || isSupabaseError(result)) {
    return null;
  }
  return result as T;
}
