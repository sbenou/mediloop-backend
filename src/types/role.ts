
import { Role } from './supabase';

export interface RoleWithPermissions extends Omit<Role, 'created_at' | 'updated_at'> {
  created_at?: string;
  updated_at?: string;
  permissions?: string[];
}
