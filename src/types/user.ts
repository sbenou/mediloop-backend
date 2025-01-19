export type UserRole = 'user' | 'doctor' | 'pharmacist' | 'superadmin'

export interface UserProfile {
  id: string
  role: UserRole
  full_name?: string | null
  email?: string | null
  license_number?: string | null
  created_at?: string | null
  updated_at?: string | null
  city?: string | null
  role_id?: string | null
  is_blocked?: boolean | null
  deleted_at?: string | null
  cns_card_front?: string | null
  cns_card_back?: string | null
  cns_number?: string | null
  date_of_birth?: string | null
  avatar_url?: string | null
  doctor_stamp_url?: string | null
  doctor_signature_url?: string | null
}