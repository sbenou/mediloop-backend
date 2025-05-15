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

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  meta?: Record<string, any>;
  deleted_at?: string | null;
  timestamp?: string | Date;
  description?: string;
}
