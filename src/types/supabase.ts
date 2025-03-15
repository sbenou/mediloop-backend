
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SupportedCountry = "Luxembourg" | "France";

export interface BankHoliday {
  id: string;
  country: SupportedCountry;
  holiday_name: string;
  holiday_date: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean | null;
  created_at: string;
  updated_at: string;
  additional_time_slots: string | null;
  time_slots: TimeSlot[];
}

export interface Teleconsultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string | null;
  room_id?: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    full_name: string | null;
    email: string | null;
  };
  doctor?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  created_at: string;
  deleted_at?: string | null;
  meta?: Json | null;
}

export function isTimeSlot(obj: any): obj is TimeSlot {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'startTime' in obj &&
    'endTime' in obj &&
    typeof obj.startTime === 'string' &&
    typeof obj.endTime === 'string'
  );
}
