export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'doctor' | 'pharmacist' | 'superadmin';
  is_blocked?: boolean;
  deleted_at?: string | null;
};