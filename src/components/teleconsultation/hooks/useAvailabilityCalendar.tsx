
import { useState, useEffect } from "react";
import { addDays, startOfWeek, format, parseISO } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { BankHoliday, DoctorAvailability, Teleconsultation, TimeSlot, SupportedCountry, isTimeSlot } from "@/types/supabase";

export const useAvailabilityCalendar = (
  doctorId?: string,
  selectedCountry: SupportedCountry = "Luxembourg",
  showBankHolidays: boolean = true
) => {
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [teleconsultations, setTeleconsultations] = useState<Teleconsultation[]>([]);
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(doctorId);
  const [doctors, setDoctors] = useState<Array<{ id: string, name: string }>>([]);
  
  // Calculate days of current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  // Fetch doctor availability data
  useEffect(() => {
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
                : String(item.additional_time_slots), // Convert to string if it's a number or boolean
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
    
    fetchDoctorAvailability();
  }, [selectedDoctorId]);

  // Fetch teleconsultations data
  useEffect(() => {
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
    
    fetchTeleconsultations();
  }, [selectedDoctorId]);
  
  // Fetch bank holidays
  useEffect(() => {
    if (!showBankHolidays) {
      setBankHolidays([]);
      return;
    }
    
    const fetchBankHolidays = async () => {
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
    
    fetchBankHolidays();
  }, [selectedCountry, showBankHolidays]);
  
  // Fetch doctors for selection
  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'doctor');
        
      if (error) {
        throw error;
      }
      
      setDoctors(data.map(doc => ({ id: doc.id, name: doc.full_name || 'Unknown Doctor' })));
      
      // Set the first doctor as selected if none is selected
      if (!selectedDoctorId && data.length > 0) {
        setSelectedDoctorId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        variant: "destructive",
        title: "Failed to load doctors",
        description: "There was an error loading the list of doctors."
      });
    }
  };
  
  // Go to previous week
  const previousWeek = () => {
    setCurrentWeek(prevWeek => addDays(prevWeek, -7));
  };
  
  // Go to next week
  const nextWeek = () => {
    setCurrentWeek(prevWeek => addDays(prevWeek, 7));
  };
  
  // Reset to current week
  const resetToCurrentWeek = () => {
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };
  
  // Get the availability for a specific day
  const getDayAvailability = (dayOfWeek: number) => {
    return doctorAvailability.find(day => day.day_of_week === dayOfWeek);
  };
  
  // Check if a date is a bank holiday
  const isBankHoliday = (date: Date): BankHoliday | undefined => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return bankHolidays.find(holiday => {
      const holidayDate = format(new Date(holiday.holiday_date), 'yyyy-MM-dd');
      return holidayDate === formattedDate;
    });
  };
  
  // Check if a time slot is available for a specific day and hour
  const isTimeSlotAvailable = (day: Date, hour: number) => {
    const dayOfWeek = day.getDay();
    const availability = getDayAvailability(dayOfWeek);
    
    if (!availability || !availability.is_available || !availability.time_slots || availability.time_slots.length === 0) {
      return false;
    }
    
    // Check if the hour is within any of the available time slots
    return availability.time_slots.some(slot => {
      const startHour = parseInt(slot.startTime.split(':')[0], 10);
      const endHour = parseInt(slot.endTime.split(':')[0], 10);
      return hour >= startHour && hour < endHour;
    });
  };

  // Check if there's a teleconsultation at a specific day and hour
  const getTeleconsultationAtTime = (day: Date, hour: number) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    
    return teleconsultations.find(consultation => {
      const consultationDate = format(new Date(consultation.start_time), 'yyyy-MM-dd');
      if (consultationDate !== dayStr) return false;
      
      const startHour = new Date(consultation.start_time).getHours();
      const endHour = new Date(consultation.end_time).getHours();
      const endMinutes = new Date(consultation.end_time).getMinutes();
      
      // If end minutes are 0 and the hour equals the endHour, we don't want to include that hour
      const adjustedEndHour = endMinutes === 0 ? endHour : endHour + 1;
      
      return hour >= startHour && hour < adjustedEndHour;
    });
  };

  const refreshTeleconsultations = () => {
    if (selectedDoctorId) {
      supabase
        .from('teleconsultations')
        .select('*')
        .eq('doctor_id', selectedDoctorId)
        .eq('status', 'confirmed')
        .then(({ data, error }) => {
          if (!error && data) {
            setTeleconsultations(data);
          }
        });
    }
  };

  return {
    currentWeek,
    isLoading,
    weekDays,
    doctorAvailability,
    teleconsultations,
    bankHolidays,
    selectedDoctorId,
    doctors,
    setSelectedDoctorId,
    previousWeek,
    nextWeek,
    resetToCurrentWeek,
    getDayAvailability,
    isBankHoliday,
    isTimeSlotAvailable,
    getTeleconsultationAtTime,
    fetchDoctors,
    refreshTeleconsultations
  };
};
