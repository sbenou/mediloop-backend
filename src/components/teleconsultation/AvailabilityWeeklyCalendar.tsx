import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Loader2,
  Clock,
  Plus
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval, addHours, parse } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { BankHoliday, DoctorAvailability, TimeSlot, SupportedCountry, isTimeSlot, Teleconsultation } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import TeleconsultationBookingDialog from "./TeleconsultationBookingDialog";
import { useDoctorPatients } from "@/hooks/teleconsultation/useDoctorPatients";

interface AvailabilityWeeklyCalendarProps {
  doctorId?: string;
  doctorName?: string;
  isManagementMode?: boolean;
  showBankHolidays?: boolean;
}

// Create array of hours from 8 AM to 8 PM
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

const AvailabilityWeeklyCalendar = ({
  doctorId,
  doctorName = "your",
  isManagementMode = false,
  showBankHolidays = true
}: AvailabilityWeeklyCalendarProps) => {
  const { profile } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [teleconsultations, setTeleconsultations] = useState<Teleconsultation[]>([]);
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  // Keep the country state but remove the dropdown selector
  const [selectedCountry, setSelectedCountry] = useState<SupportedCountry>("Luxembourg");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(doctorId);
  const [doctors, setDoctors] = useState<Array<{ id: string, name: string }>>([]);
  
  // Add states for booking functionality
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  
  // Get the patients connected to the doctor
  const { patients } = useDoctorPatients(selectedDoctorId);
  
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
  
  // Fetch doctors for selection if in management mode
  useEffect(() => {
    if (!isManagementMode) return;
    
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
    
    fetchDoctors();
  }, [isManagementMode, selectedDoctorId]);
  
  // Go to previous week
  const previousWeek = () => {
    setCurrentWeek(prevWeek => addDays(prevWeek, -7));
  };
  
  // Go to next week
  const nextWeek = () => {
    setCurrentWeek(prevWeek => addDays(prevWeek, 7));
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
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTime = (time: string) => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
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
    // Refresh teleconsultations data
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

  const showBookingControls = profile?.role === 'doctor' || profile?.role === 'pharmacist' || isManagementMode;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weekly Availability Calendar</CardTitle>
            <CardDescription>
              View {doctorName} schedule including available time slots and booked consultations
            </CardDescription>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-between gap-3 mt-4">
          <div className="flex flex-wrap gap-3">
            {/* Move week navigation here, replacing the country dropdown */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={previousWeek} title="Previous week">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="whitespace-nowrap"
                onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Current Week
              </Button>
              <Button variant="outline" size="icon" onClick={nextWeek} title="Next week">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {isManagementMode && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="doctorSelect">Doctor:</Label>
                <Select
                  value={selectedDoctorId}
                  onValueChange={setSelectedDoctorId}
                  disabled={doctors.length === 0}
                >
                  <SelectTrigger className="w-[220px]" id="doctorSelect">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* Add New Appointment button */}
          {showBookingControls && (
            <Button 
              onClick={handleNewAppointment} 
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> New Appointment
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-1"></div>
            <span className="text-xs">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 rounded mr-1"></div>
            <span className="text-xs">Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-1"></div>
            <span className="text-xs">Unavailable</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-2">Loading calendar data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Day headers */}
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 font-medium text-center border-r"></div>
                {weekDays.map((day, index) => {
                  const holiday = isBankHoliday(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={`header-${index}`} 
                      className={`
                        p-2 text-center font-medium border-r
                        ${isToday ? 'bg-blue-50' : ''}
                        ${holiday ? 'bg-red-50' : ''}
                      `}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-sm">{format(day, 'MMM d')}</div>
                      {holiday && (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          {holiday.holiday_name}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Hours and time slots */}
              {HOURS.map(hour => (
                <div key={`hour-${hour}`} className="grid grid-cols-8 border-b">
                  {/* Hour column */}
                  <div className="p-2 border-r text-center font-medium">
                    {hour}:00
                  </div>
                  
                  {/* Days columns */}
                  {weekDays.map((day, dayIndex) => {
                    const isAvailable = isTimeSlotAvailable(day, hour);
                    const teleconsultation = getTeleconsultationAtTime(day, hour);
                    const holiday = isBankHoliday(day);
                    
                    return (
                      <div 
                        key={`cell-${dayIndex}-${hour}`} 
                        className={`
                          p-2 border-r h-16 relative
                          ${holiday ? 'bg-gray-50' : isAvailable ? 'bg-green-100' : 'bg-gray-50'}
                          ${teleconsultation ? 'bg-red-100' : ''}
                          ${isAvailable && !teleconsultation && !holiday && showBookingControls ? 'cursor-pointer hover:bg-green-200' : ''}
                        `}
                        onClick={() => {
                          if (isAvailable && !teleconsultation && !holiday && showBookingControls) {
                            handleTimeSlotClick(day, hour);
                          }
                        }}
                      >
                        {teleconsultation && (
                          <div className="text-xs p-1 bg-red-200 rounded">
                            <div className="font-semibold">{teleconsultation.reason || 'Teleconsultation'}</div>
                            <div>
                              {format(new Date(teleconsultation.start_time), 'HH:mm')} - 
                              {format(new Date(teleconsultation.end_time), 'HH:mm')}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
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
        />
      )}
    </Card>
  );
};

export default AvailabilityWeeklyCalendar;
