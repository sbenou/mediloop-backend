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
  Clock
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO, isWithinInterval } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { BankHoliday, DoctorAvailability, TimeSlot, SupportedCountry, isTimeSlot } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";

interface AvailabilityWeeklyCalendarProps {
  doctorId?: string;
  doctorName?: string;
  isManagementMode?: boolean;
  showBankHolidays?: boolean;
}

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
  const [bankHolidays, setBankHolidays] = useState<BankHoliday[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<SupportedCountry>("Luxembourg");
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
  
  // Render time slots for a day
  const renderTimeSlots = (dayOfWeek: number) => {
    const availability = getDayAvailability(dayOfWeek);
    
    if (!availability || !availability.is_available || !availability.time_slots || availability.time_slots.length === 0) {
      return <div className="text-gray-400 text-sm">Not available</div>;
    }
    
    return (
      <div className="space-y-1 mt-2">
        {availability.time_slots.map((slot, index) => (
          <div 
            key={index} 
            className="flex items-center text-sm bg-green-50 text-green-700 p-1 rounded"
          >
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // Determine if day has teleconsultations (placeholder for future implementation)
  const hasTeleconsultations = (date: Date) => {
    // This would check against booked teleconsultations for this doctor on this date
    // Placeholder for now
    return false;
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weekly Availability Calendar</CardTitle>
            <CardDescription>
              View {doctorName} schedule including available time slots and bank holidays
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
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
        </div>
        
        <div className="flex flex-wrap gap-3 mt-4">
          {showBankHolidays && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="country">Country:</Label>
              <Select
                value={selectedCountry}
                onValueChange={(value) => setSelectedCountry(value as SupportedCountry)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {isManagementMode && (
            <div className="flex items-center space-x-2 ml-auto">
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
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-2">Loading calendar data...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Day headers */}
            {weekDays.map((day, index) => (
              <div 
                key={`header-${index}`} 
                className="text-center font-medium p-2"
              >
                <div>{format(day, 'EEE')}</div>
                <div className="text-sm">{format(day, 'MMM d')}</div>
              </div>
            ))}
            
            {/* Calendar cells */}
            {weekDays.map((day, index) => {
              const dayOfWeek = day.getDay();
              const availability = getDayAvailability(dayOfWeek);
              const holiday = isBankHoliday(day);
              const hasTeleconsultation = hasTeleconsultations(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={`cell-${index}`}
                  className={`
                    p-2 border rounded-md min-h-[120px] flex flex-col
                    ${isToday ? 'border-primary' : 'border-gray-200'}
                    ${holiday ? 'bg-red-50' : availability?.is_available ? 'bg-green-50/50' : 'bg-gray-50/50'}
                  `}
                >
                  {holiday && (
                    <Badge variant="destructive" className="self-start mb-1">
                      {holiday.holiday_name}
                    </Badge>
                  )}
                  
                  {renderTimeSlots(dayOfWeek)}
                  
                  {hasTeleconsultation && (
                    <Badge className="self-start mt-auto mb-1 bg-blue-500">
                      Appointments
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityWeeklyCalendar;
