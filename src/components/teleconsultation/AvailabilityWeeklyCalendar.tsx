
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2,
  Plus
} from "lucide-react";
import { SupportedCountry, AppointmentType } from "@/types/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import TeleconsultationBookingDialog from "./TeleconsultationBookingDialog";
import { useDoctorPatients } from "@/hooks/teleconsultation/useDoctorPatients";
import { useAvailabilityCalendar } from "./hooks/useAvailabilityCalendar";
import WeekNavigation from "./calendar/WeekNavigation";
import TimeSlotGrid from "./calendar/TimeSlotGrid";
import CalendarLegend from "./calendar/CalendarLegend";
import DoctorSelector from "./calendar/DoctorSelector";

interface AvailabilityWeeklyCalendarProps {
  doctorId?: string;
  doctorName?: string;
  isManagementMode?: boolean;
  showBankHolidays?: boolean;
  appointmentType?: AppointmentType;
}

// Create array of hours from 8 AM to 8 PM
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

const AvailabilityWeeklyCalendar = ({
  doctorId,
  doctorName = "your",
  isManagementMode = false,
  showBankHolidays = true,
  appointmentType = 'teleconsultation'
}: AvailabilityWeeklyCalendarProps) => {
  const { profile } = useAuth();
  const [selectedCountry] = useState<SupportedCountry>("Luxembourg");
  
  // Add states for booking functionality
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  
  const {
    currentWeek,
    isLoading,
    weekDays,
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
  } = useAvailabilityCalendar(doctorId, selectedCountry, showBankHolidays, appointmentType);
  
  // Get the patients connected to the doctor
  const { patients } = useDoctorPatients(selectedDoctorId);
  
  // Fetch doctors for selection if in management mode
  useEffect(() => {
    if (!isManagementMode) return;
    fetchDoctors();
  }, [isManagementMode]);
  
  // Handle clicking on a time slot to open booking dialog
  const handleTimeSlotClick = (day: Date, hour: number) => {
    // Only allow booking on available slots
    if (isTimeSlotAvailable(day, hour) && !getTeleconsultationAtTime(day, hour)) {
      setSelectedDate(day);
      setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
      setIsBookingDialogOpen(true);
    }
  };

  // Handle creating a new appointment
  const handleNewAppointment = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setIsBookingDialogOpen(true);
  };
  
  // Handle successful booking creation
  const handleBookingCreated = () => {
    refreshTeleconsultations();
  };

  const showBookingControls = profile?.role === 'doctor' || profile?.role === 'pharmacist' || isManagementMode;

  // Customize button text based on appointment type
  const getNewButtonText = () => {
    return appointmentType === 'teleconsultation' 
      ? 'New Teleconsultation'
      : 'New In-Person Appointment';
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weekly Availability Calendar</CardTitle>
            <CardDescription className="mb-8">
              View {doctorName} schedule including available time slots and booked {appointmentType === 'teleconsultation' ? 'teleconsultations' : 'appointments'}
            </CardDescription>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-between gap-3 mt-4">
          <div className="flex flex-wrap gap-3">
            {/* Week navigation */}
            <WeekNavigation
              currentWeek={currentWeek}
              onPreviousWeek={previousWeek}
              onNextWeek={nextWeek}
              onCurrentWeek={resetToCurrentWeek}
            />
            
            {/* Doctor selector for management mode */}
            {isManagementMode && (
              <DoctorSelector
                doctors={doctors}
                selectedDoctorId={selectedDoctorId}
                onDoctorChange={setSelectedDoctorId}
              />
            )}
          </div>
          
          {/* Add New Appointment/Teleconsultation button */}
          {showBookingControls && (
            <Button 
              onClick={handleNewAppointment} 
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> {getNewButtonText()}
            </Button>
          )}
        </div>

        <CalendarLegend />
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-2">Loading calendar data...</span>
          </div>
        ) : (
          <TimeSlotGrid
            weekDays={weekDays}
            hours={HOURS}
            getDayAvailability={getDayAvailability}
            isTimeSlotAvailable={isTimeSlotAvailable}
            getTeleconsultationAtTime={getTeleconsultationAtTime}
            isBankHoliday={isBankHoliday}
            onTimeSlotClick={handleTimeSlotClick}
            showBookingControls={showBookingControls}
          />
        )}
      </CardContent>

      {/* Booking Dialog */}
      {isBookingDialogOpen && (
        <TeleconsultationBookingDialog
          isOpen={isBookingDialogOpen}
          onClose={() => setIsBookingDialogOpen(false)}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          doctorId={selectedDoctorId || profile?.id || ''}
          patients={patients}
          onBookingCreated={handleBookingCreated}
          appointmentType={appointmentType}
        />
      )}
    </Card>
  );
};

export default AvailabilityWeeklyCalendar;
