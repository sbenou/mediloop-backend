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
    
    // Process time slots
    const processedData = data.map(item => {
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
      // Create default values for patient and doctor if they don't exist or have errors
      const defaultPatient = { full_name: 'Unknown Patient', email: null };
      const defaultDoctor = { full_name: 'Unknown Doctor', email: null };
      
      // Extract patient data safely with proper null checks
      const patientData = (() => {
        if (!item.patient) return defaultPatient;
        
        const patientObj = item.patient as Record<string, any>;
        
        return {
          full_name: typeof patientObj === 'object' && 
                    'full_name' in patientObj &&
                    patientObj.full_name !== null
            ? patientObj.full_name 
            : 'Unknown Patient',
          email: typeof patientObj === 'object' && 
                'email' in patientObj
            ? patientObj.email
            : null
        };
      })();
      
      // Extract doctor data safely with proper null checks
      const doctorData = (() => {
        if (!item.doctor) return defaultDoctor;
        
        const doctorObj = item.doctor as Record<string, any>;
        
        return {
          full_name: typeof doctorObj === 'object' && 
                    'full_name' in doctorObj &&
                    doctorObj.full_name !== null
            ? doctorObj.full_name 
            : 'Unknown Doctor',
          email: typeof doctorObj === 'object' && 
                'email' in doctorObj
            ? doctorObj.email 
            : null
        };
      })();
      
      // Ensure the meta field exists, even if it's empty
      const metaData = item.meta || {};
      
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
