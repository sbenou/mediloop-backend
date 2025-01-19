import { Role as SupabaseRole } from './supabase';

export interface Role extends SupabaseRole {
  permissions?: string[];
}