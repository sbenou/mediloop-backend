
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

// Add the TimeSlot interface
export interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Add the isTimeSlot type guard function
export function isTimeSlot(obj: any): obj is TimeSlot {
  return obj && 
    typeof obj === 'object' &&
    typeof obj.startTime === 'string' &&
    typeof obj.endTime === 'string';
}

// Add the DoctorAvailability interface
export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  additional_time_slots: string | TimeSlot[] | null;
  time_slots: TimeSlot[];
  appointment_type: AppointmentType;
  workplace_id?: string;
}

// Add the AppointmentType type
export type AppointmentType = 'teleconsultation' | 'in-person' | 'both';

// Add the Teleconsultation interface
export interface Teleconsultation {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  room_id?: string;
  created_at: string;
  updated_at: string;
  doctor?: {
    id: string;
    full_name: string;
    email: string;
  };
  patient?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Add the BankHoliday interface
export interface BankHoliday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  country: SupportedCountry;
  created_at: string;
  updated_at: string;
}

// Add the SupportedCountry type
export type SupportedCountry = 'Luxembourg' | 'France' | 'Germany' | 'Belgium';

// Add the ConnectionStatus type
export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

// Add the Role type
export interface Role {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  requires_license: boolean;
}

// Add the Profile interface (separate from UserProfile)
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

// Add the Address interface
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
