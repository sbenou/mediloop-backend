
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { BankHoliday, DoctorAvailability, Teleconsultation, TimeSlot, SupportedCountry, isTimeSlot } from "@/types/supabase";

export const useAvailabilityData = (
  selectedDoctorId?: string,
  selectedCountry: SupportedCountry = "Luxembourg",
  showBankHolidays: boolean = true
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [teleconsultations, setTeleconsultations] = useState<Teleconsultation[]>([]);
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  
  // Fetch doctor availability data
  const fetchDoctorAvailability = async () => {
    if (!selectedDoctorId) {
      setDoctorAvailability([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', selectedDoctorId);
      
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
          time_slots: timeSlots
        };
        
        return availabilityItem;
      });
      
      setDoctorAvailability(processedData);
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      toast({
        variant: "destructive",
        title: "Failed to load availability",
        description: "There was an error loading the doctor's availability data."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teleconsultations data
  const fetchTeleconsultations = async () => {
    if (!selectedDoctorId) {
      setTeleconsultations([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('teleconsultations')
        .select('*')
        .eq('doctor_id', selectedDoctorId)
        .eq('status', 'confirmed');
      
      if (error) {
        throw error;
      }
      
      setTeleconsultations(data || []);
    } catch (error) {
      console.error('Error fetching teleconsultations:', error);
    }
  };
  
  // Fetch bank holidays
  const fetchBankHolidays = async () => {
    if (!showBankHolidays) {
      setBankHolidays([]);
      return;
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
      
      setBankHolidays(data || []);
    } catch (error) {
      console.error('Error fetching bank holidays:', error);
      toast({
        variant: "destructive",
        title: "Failed to load bank holidays",
        description: "There was an error loading bank holidays."
      });
    }
  };

  return {
    isLoading, 
    doctorAvailability, 
    teleconsultations, 
    bankHolidays,
    fetchDoctorAvailability,
    fetchTeleconsultations,
    fetchBankHolidays
  };
};
