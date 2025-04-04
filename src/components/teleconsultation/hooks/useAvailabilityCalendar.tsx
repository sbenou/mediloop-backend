
import { useState, useEffect } from "react";
import { addDays, startOfWeek } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { BankHoliday, DoctorAvailability, Teleconsultation, SupportedCountry, AppointmentType } from "@/types/supabase";
import { useAvailabilityData } from "./useAvailabilityData";
import { useAvailabilityHelpers } from "./useAvailabilityHelpers";

export const useAvailabilityCalendar = (
  doctorId?: string,
  selectedCountry: SupportedCountry = "Luxembourg",
  showBankHolidays: boolean = true,
  appointmentType: 'teleconsultation' | 'in-person' = 'teleconsultation'
) => {
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(doctorId);
  const [doctors, setDoctors] = useState<Array<{ id: string, name: string }>>([]);
  
  // Calculate days of current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  
  const { 
    isLoading, 
    doctorAvailability, 
    teleconsultations, 
    bankHolidays, 
    fetchDoctorAvailability,
    fetchTeleconsultations,
    fetchBankHolidays
  } = useAvailabilityData(selectedDoctorId, selectedCountry, showBankHolidays, appointmentType);
  
  const {
    getDayAvailability,
    isBankHoliday,
    isTimeSlotAvailable,
    getTeleconsultationAtTime
  } = useAvailabilityHelpers(doctorAvailability, teleconsultations, bankHolidays, appointmentType);

  // Initial load when selectedDoctorId changes
  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorAvailability();
      fetchTeleconsultations();
    }
  }, [selectedDoctorId, appointmentType]);

  // Load bank holidays when country changes
  useEffect(() => {
    if (showBankHolidays) {
      fetchBankHolidays();
    }
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
  
  const refreshTeleconsultations = () => {
    if (selectedDoctorId) {
      fetchTeleconsultations();
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
