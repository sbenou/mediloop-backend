export type UserRole = 'user' | 'doctor' | 'pharmacist' | 'superadmin';

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  is_blocked?: boolean;
  deleted_at?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  cns_card_back?: string | null;
  cns_card_front?: string | null;
  cns_number?: string | null;
  date_of_birth?: string | null;
  doctor_signature_url?: string | null;
  doctor_stamp_url?: string | null;
  license_number?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};