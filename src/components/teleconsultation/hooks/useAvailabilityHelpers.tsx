
import { format } from "date-fns";
import { BankHoliday, DoctorAvailability, Teleconsultation } from "@/types/supabase";

export const useAvailabilityHelpers = (
  doctorAvailability: DoctorAvailability[],
  teleconsultations: Teleconsultation[],
  bankHolidays: BankHoliday[],
  appointmentType: 'teleconsultation' | 'in-person' = 'teleconsultation'
) => {
  // Get the availability for a specific day
  const getDayAvailability = (dayOfWeek: number) => {
    return doctorAvailability.find(day => {
      // Day must match and be available
      const isDayMatching = day.day_of_week === dayOfWeek && day.is_available;
      
      // If appointment type is specified, filter by it
      if (appointmentType === 'teleconsultation') {
        return isDayMatching && (!day.appointment_type || day.appointment_type === 'teleconsultation' || day.appointment_type === 'both');
      } else if (appointmentType === 'in-person') {
        return isDayMatching && (!day.appointment_type || day.appointment_type === 'in-person' || day.appointment_type === 'both');
      }
      
      return isDayMatching;
    });
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

  return {
    getDayAvailability,
    isBankHoliday,
    isTimeSlotAvailable,
    getTeleconsultationAtTime
  };
};
