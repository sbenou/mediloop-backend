/** Scheduling / availability types (Neon `doctor_availability`, bank holidays, etc.). */

export type AppointmentType = "teleconsultation" | "in-person" | "both";

export type SupportedCountry = "Luxembourg" | "France";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export function isTimeSlot(obj: unknown): obj is TimeSlot {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "startTime" in obj &&
    "endTime" in obj &&
    typeof (obj as TimeSlot).startTime === "string" &&
    typeof (obj as TimeSlot).endTime === "string"
  );
}

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

export interface BankHoliday {
  id: string;
  holiday_date: string;
  holiday_name: string;
  country: SupportedCountry;
  created_at: string;
  updated_at: string;
}
