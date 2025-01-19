import { Role as SupabaseRole } from './supabase';

export interface Role extends Omit<SupabaseRole, 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
  permissions?: string[];
}