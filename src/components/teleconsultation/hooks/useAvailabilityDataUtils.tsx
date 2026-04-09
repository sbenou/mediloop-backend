
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  fetchDoctorAvailabilityApi,
  fetchTeleconsultationsApi,
} from "@/services/clinicalApi";
import type { Teleconsultation } from "@/types/clinical";
import type {
  BankHoliday,
  DoctorAvailability,
  TimeSlot,
  SupportedCountry,
  AppointmentType,
} from "@/types/domain";
import { isTimeSlot } from "@/types/domain";

/**
 * Processes time slots from a doctor availability item
 */
const processTimeSlots = (item: any): TimeSlot[] => {
  let timeSlots: TimeSlot[] = [];
  
  // Set default time slot from start_time and end_time
  if (item.start_time && item.end_time) {
    timeSlots.push({
      startTime: item.start_time,
      endTime: item.end_time
    });
  }
  
  // Process additional time slots if they exist
  if (item.additional_time_slots) {
    try {
      const additionalSlots = typeof item.additional_time_slots === 'string'
        ? JSON.parse(item.additional_time_slots)
        : item.additional_time_slots;
        
      if (Array.isArray(additionalSlots)) {
        additionalSlots.forEach(slot => {
          if (isTimeSlot(slot)) {
            timeSlots.push({
              startTime: slot.startTime,
              endTime: slot.endTime
            });
          }
        });
      }
    } catch (e) {
      console.error('Error parsing additional time slots:', e);
    }
  }
  
  return timeSlots;
};

/**
 * Safely extracts patient or doctor data from a teleconsultation record
 */
const extractEntityData = (entity: any, defaultName: string) => {
  if (!entity) return { id: undefined, full_name: defaultName, email: null };
  
  const entityObj = entity as Record<string, any>;
  
  return {
    id: typeof entityObj === 'object' && 'id' in entityObj ? entityObj.id : undefined,
    full_name: typeof entityObj === 'object' && 
              'full_name' in entityObj &&
              entityObj.full_name !== null
      ? entityObj.full_name 
      : defaultName,
    email: typeof entityObj === 'object' && 
          'email' in entityObj
      ? entityObj.email
      : null
  };
};

/**
 * Fetches doctor availability from the Deno API (Neon).
 */
export const fetchDoctorAvailability = async (
  doctorId: string | undefined,
  appointmentType: AppointmentType = 'teleconsultation'
): Promise<DoctorAvailability[]> => {
  if (!doctorId) {
    return [];
  }
  
  try {
    const data = await fetchDoctorAvailabilityApi(doctorId, appointmentType);

    const processedData = data.map(item => {
      const timeSlots = processTimeSlots(item);
      
      // Create proper DoctorAvailability object to fix type issues
      const availabilityItem: DoctorAvailability = {
        ...item,
        additional_time_slots: typeof item.additional_time_slots === 'object' 
          ? JSON.stringify(item.additional_time_slots) 
          : item.additional_time_slots === null 
            ? null 
            : String(item.additional_time_slots),
        time_slots: timeSlots,
        appointment_type: (item.appointment_type as AppointmentType) || 'both'
      };
      
      return availabilityItem;
    });
    
    return processedData;
  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    toast({
      variant: "destructive",
      title: "Failed to load availability",
      description: "There was an error loading the doctor's availability data."
    });
    return [];
  }
};

/**
 * Fetches teleconsultations for a doctor from the Mediloop API (Neon-backed).
 * Uses the authenticated user's session; rows are limited to what the API returns for that role
 * (doctor: own consultations). `doctorId` must match the signed-in doctor when using the calendar as that doctor.
 */
export const fetchTeleconsultations = async (
  doctorId: string | undefined,
  appointmentType: AppointmentType = "teleconsultation",
): Promise<Teleconsultation[]> => {
  if (!doctorId) {
    return [];
  }

  try {
    const data = await fetchTeleconsultationsApi(doctorId);
    let rows = data.filter(
      (t) => t.doctor_id === doctorId && t.status === "confirmed",
    );

    if (appointmentType === "teleconsultation") {
      rows = rows.filter((t) => {
        const meta = (t.meta || {}) as Record<string, unknown>;
        const reason = (t.reason || "").toLowerCase();
        return (
          meta.is_teleconsultation === true ||
          meta.appointment_type === "teleconsultation" ||
          reason.includes("teleconsultation")
        );
      });
    } else if (appointmentType === "in-person") {
      rows = rows.filter((t) => {
        const meta = (t.meta || {}) as Record<string, unknown>;
        const reason = (t.reason || "").toLowerCase();
        return (
          meta.is_in_person === true ||
          meta.appointment_type === "in-person" ||
          reason.includes("in-person") ||
          reason.includes("in person")
        );
      });
    }

    return rows.map((item) => {
      const patientData = extractEntityData(item.patient, "Unknown Patient");
      const doctorData = extractEntityData(item.doctor, "Unknown Doctor");
      const metaData = item.meta || {};
      return {
        ...item,
        patient: patientData,
        doctor: doctorData,
        meta: metaData,
      };
    });
  } catch (error) {
    console.error("Error fetching teleconsultations:", error);
    return [];
  }
};

/**
 * Fetches bank holidays data from Supabase
 */
export const fetchBankHolidays = async (
  selectedCountry: SupportedCountry = "Luxembourg",
  showBankHolidays: boolean = true
): Promise<BankHoliday[]> => {
  if (!showBankHolidays) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('bank_holidays')
      .select('*')
      .eq('country', selectedCountry)
      .order('holiday_date', { ascending: true });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bank holidays:', error);
    toast({
      variant: "destructive",
      title: "Failed to load bank holidays",
      description: "There was an error loading bank holidays."
    });
    return [];
  }
};
