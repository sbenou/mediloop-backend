import { Profile } from './supabase';

export type UserRole = 'patient' | 'doctor' | 'pharmacist' | 'delivery' | 'superadmin';

export interface UserProfile extends Omit<Profile, 'role'> {
  role: UserRole;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: UserRole;
  profile?: UserProfile;
}