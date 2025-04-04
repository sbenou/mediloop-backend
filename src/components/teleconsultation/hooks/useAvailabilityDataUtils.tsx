
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { 
  BankHoliday, 
  DoctorAvailability, 
  Teleconsultation, 
  TimeSlot, 
  SupportedCountry, 
  isTimeSlot, 
  AppointmentType 
} from "@/types/supabase";

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
  if (!entity) return { full_name: defaultName, email: null };
  
  const entityObj = entity as Record<string, any>;
  
  return {
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
 * Fetches doctor availability data from Supabase
 */
export const fetchDoctorAvailability = async (
  doctorId: string | undefined,
  appointmentType: AppointmentType = 'teleconsultation'
): Promise<DoctorAvailability[]> => {
  if (!doctorId) {
    return [];
  }
  
  try {
    const query = supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId);

    // Filter by appointment type if specified
    if (appointmentType === 'teleconsultation') {
      query.or('appointment_type.eq.teleconsultation,appointment_type.eq.both,appointment_type.is.null');
    } else if (appointmentType === 'in-person') {
      query.or('appointment_type.eq.in-person,appointment_type.eq.both,appointment_type.is.null');
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Process data and return
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
 * Fetches teleconsultations data from Supabase
 */
export const fetchTeleconsultations = async (
  doctorId: string | undefined,
  appointmentType: AppointmentType = 'teleconsultation'
): Promise<Teleconsultation[]> => {
  if (!doctorId) {
    return [];
  }
  
  try {
    const query = supabase
      .from('teleconsultations')
      .select('*, patient:patient_id(full_name, email), doctor:doctor_id(full_name, email)')
      .eq('doctor_id', doctorId)
      .eq('status', 'confirmed');

    // Add filtering for appointment type
    if (appointmentType === 'teleconsultation') {
      query.or('meta->is_teleconsultation.eq.true,meta->appointment_type.eq.teleconsultation,reason.ilike.%teleconsultation%');
    } else if (appointmentType === 'in-person') {
      query.or('meta->is_in_person.eq.true,meta->appointment_type.eq.in-person,reason.ilike.%in-person%,reason.ilike.%in person%');
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!data) {
      return [];
    }
    
    // Process the data to ensure it matches the Teleconsultation type
    const processedData: Teleconsultation[] = data.map(item => {
      // Extract patient and doctor data safely
      const patientData = extractEntityData(item.patient, 'Unknown Patient');
      const doctorData = extractEntityData(item.doctor, 'Unknown Doctor');
      
      // Initialize metaData as an empty object if it doesn't exist in the item
      const metaData = (item as any).meta || {};
      
      return {
        id: item.id,
        patient_id: item.patient_id,
        doctor_id: item.doctor_id,
        start_time: item.start_time,
        end_time: item.end_time,
        status: item.status,
        reason: item.reason,
        room_id: item.room_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        patient: patientData,
        doctor: doctorData,
        meta: metaData
      } as Teleconsultation;
    });
    
    return processedData;
  } catch (error) {
    console.error('Error fetching teleconsultations:', error);
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
