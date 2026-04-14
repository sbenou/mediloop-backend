/** User/profile domain (auth + Neon `auth.users` / app profile tables). */

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  updated_at?: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  speciality: string;
  hospital: string;
  license_number: string;
  accepted_terms: boolean;
  profile?: UserProfile | null;
}

export interface PharmacyProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  address: string;
  phone_number: string;
  accepted_terms: boolean;
  profile?: UserProfile | null;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  address: string;
  accepted_terms: boolean;
  profile?: UserProfile | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  requires_license: boolean;
}

export interface Profile {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  city: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
}

export interface Address {
  id: string;
  user_id: string;
  country: string;
  street: string;
  city: string;
  postal_code: string;
  type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
