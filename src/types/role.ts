
import { Role as SupabaseRole } from './supabase';

export interface RoleWithPermissions extends Omit<SupabaseRole, 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
  permissions?: string[];
}

export type Role = SupabaseRole;
