
import { useState } from "react";
import { 
  BankHoliday, 
  DoctorAvailability, 
  Teleconsultation, 
  SupportedCountry, 
  AppointmentType 
} from "@/types/supabase";
import { 
  fetchDoctorAvailability, 
  fetchTeleconsultations, 
  fetchBankHolidays 
} from "./useAvailabilityDataUtils";

export const useAvailabilityData = (
  selectedDoctorId?: string,
  selectedCountry: SupportedCountry = "Luxembourg",
  showBankHolidays: boolean = true,
  appointmentType: AppointmentType = 'teleconsultation'
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [teleconsultations, setTeleconsultations] = useState<Teleconsultation[]>([]);
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  
  // Fetch doctor availability data
  const handleFetchDoctorAvailability = async () => {
    if (!selectedDoctorId) {
      setDoctorAvailability([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const availabilityData = await fetchDoctorAvailability(selectedDoctorId, appointmentType);
      setDoctorAvailability(availabilityData);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teleconsultations data
  const handleFetchTeleconsultations = async () => {
    if (!selectedDoctorId) {
      setTeleconsultations([]);
      return;
    }
    
    try {
      const teleconsultationsData = await fetchTeleconsultations(selectedDoctorId, appointmentType);
      setTeleconsultations(teleconsultationsData);
    } catch (error) {
      console.error('Error in handleFetchTeleconsultations:', error);
      setTeleconsultations([]);
    }
  };
  
  // Fetch bank holidays
  const handleFetchBankHolidays = async () => {
    try {
      const bankHolidaysData = await fetchBankHolidays(selectedCountry, showBankHolidays);
      setBankHolidays(bankHolidaysData);
    } catch (error) {
      console.error('Error in handleFetchBankHolidays:', error);
      setBankHolidays([]);
    }
  };

  return {
    isLoading, 
    doctorAvailability, 
    teleconsultations, 
    bankHolidays,
    fetchDoctorAvailability: handleFetchDoctorAvailability,
    fetchTeleconsultations: handleFetchTeleconsultations,
    fetchBankHolidays: handleFetchBankHolidays
  };
};
