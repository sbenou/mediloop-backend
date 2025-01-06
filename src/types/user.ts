export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'doctor' | 'pharmacist' | 'superadmin';
};