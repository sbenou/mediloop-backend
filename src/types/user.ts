import { Profile } from './supabase';

// Role is now a string type since it can be any valid role from the database
export interface UserProfile extends Omit<Profile, 'role'> {
  role: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  profile?: UserProfile;
}