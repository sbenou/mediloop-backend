
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X, Save, Clock } from "lucide-react";
import { format, parse, addMinutes } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface DoctorAvailabilityCalendarProps {
  doctorId: string;
  doctorName?: string;
  onBookingConfirmed?: () => void;
  isManagementMode?: boolean;
}

// Define the structure for doctor availability
interface DoctorAvailability {
  id?: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  time_slots?: TimeSlot[];
}

// Define time slot type
interface TimeSlot {
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Generate 24-hour format time options in 15 min increments
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const DoctorAvailabilityCalendar = ({ 
  doctorId, 
  doctorName = "the doctor", 
  onBookingConfirmed,
  isManagementMode = false
}: DoctorAvailabilityCalendarProps) => {
  const { profile } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{
    startTime: '09:00',
    endTime: '17:00'
  }]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<DoctorAvailability[]>([]);

  // Load doctor's availability settings
  useEffect(() => {
    if (doctorId) {
      loadAvailability();
    }
  }, [doctorId]);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId);
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Transform data to include time_slots array
        const processedData = data.map(item => {
          // Parse any stored time slots or create default
          const defaultSlot = {
            startTime: item.start_time || '09:00',
            endTime: item.end_time || '17:00'
          };
          
          // If additional_time_slots exists, parse it
          let allTimeSlots = [defaultSlot];
          if (item.additional_time_slots) {
            try {
              const additionalSlots = JSON.parse(item.additional_time_slots);
              allTimeSlots = [defaultSlot, ...additionalSlots];
            } catch (e) {
              console.error('Error parsing additional time slots:', e);
            }
          }
          
          return {
            ...item,
            time_slots: allTimeSlots
          };
        });
        
        setAvailabilityData(processedData as DoctorAvailability[]);
      } else {
        // Initialize default availability for all days if none exists
        const defaultAvailability: DoctorAvailability[] = DAYS_OF_WEEK.map((_, index) => ({
          doctor_id: doctorId,
          day_of_week: index,
          start_time: '09:00',
          end_time: '17:00',
          is_available: false,
          time_slots: [{
            startTime: '09:00',
            endTime: '17:00'
          }]
        }));
        setAvailabilityData(defaultAvailability);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      toast({
        variant: "destructive",
        title: "Failed to load availability",
        description: "There was an error loading the doctor's availability. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update UI when a day is selected
  useEffect(() => {
    if (selectedDay !== null) {
      const currentDayData = availabilityData.find(day => day.day_of_week === selectedDay);
      
      if (currentDayData) {
        setIsAvailable(currentDayData.is_available);
        
        // Set time slots if they exist in the data
        if (currentDayData.time_slots && currentDayData.time_slots.length > 0) {
          setTimeSlots(currentDayData.time_slots);
        } else if (currentDayData.start_time && currentDayData.end_time) {
          // Create a single time slot from start and end times
          setTimeSlots([{
            startTime: currentDayData.start_time,
            endTime: currentDayData.end_time
          }]);
        } else {
          // Default time slot
          setTimeSlots([{
            startTime: '09:00',
            endTime: '17:00'
          }]);
        }
      } else {
        // Default values if no data for this day
        setIsAvailable(false);
        setTimeSlots([{
          startTime: '09:00',
          endTime: '17:00'
        }]);
      }
    }
  }, [selectedDay, availabilityData]);

  const handleTimeChange = (index: number, type: 'startTime' | 'endTime', value: string) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index][type] = value;
    setTimeSlots(newTimeSlots);
  };

  const addTimeSlot = () => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots.push({
      startTime: '13:00',
      endTime: '17:00'
    });
    setTimeSlots(newTimeSlots);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      const newTimeSlots = timeSlots.filter((_, i) => i !== index);
      setTimeSlots(newTimeSlots);
    }
  };

  const saveAvailability = async () => {
    if (selectedDay === null) {
      toast({
        title: "Select a day",
        description: "Please select a day of the week to set availability."
      });
      return;
    }

    try {
      setIsSaving(true);

      // We'll just use the first time slot for the main start/end time fields
      // for backward compatibility
      const primaryTimeSlot = timeSlots[0];
      const additionalTimeSlots = timeSlots.length > 1 ? timeSlots.slice(1) : [];
      
      console.log('Saving time slots:', timeSlots);
      console.log('Additional time slots:', additionalTimeSlots);

      // Find existing record for this day
      const existingDay = availabilityData.find(day => day.day_of_week === selectedDay);
      
      if (existingDay?.id) {
        // Update existing record
        const { error } = await supabase
          .from('doctor_availability')
          .update({
            is_available: isAvailable,
            start_time: primaryTimeSlot.startTime,
            end_time: primaryTimeSlot.endTime,
            additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDay.id);
          
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('doctor_availability')
          .insert([{
            doctor_id: doctorId,
            day_of_week: selectedDay,
            start_time: primaryTimeSlot.startTime,
            end_time: primaryTimeSlot.endTime,
            additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null,
            is_available: isAvailable
          }]);
          
        if (error) throw error;
      }

      // Update local state to reflect the changes
      const updatedAvailabilityData = [...availabilityData];
      const dayIndex = updatedAvailabilityData.findIndex(day => day.day_of_week === selectedDay);
      
      if (dayIndex !== -1) {
        updatedAvailabilityData[dayIndex] = {
          ...updatedAvailabilityData[dayIndex],
          is_available: isAvailable,
          start_time: primaryTimeSlot.startTime,
          end_time: primaryTimeSlot.endTime,
          time_slots: [...timeSlots],
          additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null
        };
      } else {
        updatedAvailabilityData.push({
          doctor_id: doctorId,
          day_of_week: selectedDay,
          start_time: primaryTimeSlot.startTime,
          end_time: primaryTimeSlot.endTime,
          is_available: isAvailable,
          time_slots: [...timeSlots],
          additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null
        });
      }
      
      setAvailabilityData(updatedAvailabilityData);
      
      toast({
        title: "Availability saved",
        description: `Your availability for ${DAYS_OF_WEEK[selectedDay]} has been updated.`
      });
      
      // Reload the availability data to ensure the UI is up-to-date
      await loadAvailability();
      
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        variant: "destructive",
        title: "Failed to save availability",
        description: "There was an error saving your availability. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateAllDaysAtOnce = async () => {
    try {
      setIsSaving(true);
      
      // First, delete all existing availability records
      const { error: deleteError } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctorId);
        
      if (deleteError) throw deleteError;
      
      // Get additional time slots if any
      const primaryTimeSlot = timeSlots[0];
      const additionalTimeSlots = timeSlots.length > 1 ? timeSlots.slice(1) : [];
      
      // Then, insert new availability for all days
      const newAvailabilityRecords = DAYS_OF_WEEK.map((_, index) => ({
        doctor_id: doctorId,
        day_of_week: index,
        start_time: primaryTimeSlot.startTime,
        end_time: primaryTimeSlot.endTime,
        additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null,
        is_available: isAvailable
      }));
      
      const { error: insertError } = await supabase
        .from('doctor_availability')
        .insert(newAvailabilityRecords);
        
      if (insertError) throw insertError;
      
      // Update local state
      const updatedAvailabilityData = DAYS_OF_WEEK.map((_, index) => ({
        doctor_id: doctorId,
        day_of_week: index,
        start_time: primaryTimeSlot.startTime,
        end_time: primaryTimeSlot.endTime,
        is_available: isAvailable,
        time_slots: [...timeSlots],
        additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null
      }));
      
      setAvailabilityData(updatedAvailabilityData);
      
      toast({
        title: "Availability updated",
        description: "Your availability for all days has been updated."
      });
      
      // Reload the availability data to ensure the UI is up-to-date
      await loadAvailability();
      
    } catch (error) {
      console.error('Error updating all days:', error);
      toast({
        variant: "destructive",
        title: "Failed to update availability",
        description: "There was an error updating your availability. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderDaySummary = (day: number) => {
    const dayData = availabilityData.find(d => d.day_of_week === day);
    
    if (!dayData || !dayData.is_available) {
      return <span className="text-muted-foreground">Not available</span>;
    }
    
    // Render the primary time slot
    let timeDisplay = `${dayData.start_time} - ${dayData.end_time}`;
    
    // Add additional time slots if they exist
    if (dayData.additional_time_slots) {
      try {
        const additionalSlots = JSON.parse(dayData.additional_time_slots);
        if (additionalSlots && additionalSlots.length > 0) {
          additionalSlots.forEach((slot: TimeSlot) => {
            timeDisplay += `\n${slot.startTime} - ${slot.endTime}`;
          });
        }
      } catch (e) {
        console.error('Error parsing additional time slots:', e);
      }
    }
    
    return (
      <span className="text-green-600 font-medium whitespace-pre-line">
        {timeDisplay}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading availability settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Availability Calendar</CardTitle>
          <CardDescription>
            Set your availability for teleconsultations. Patients will only be able to book appointments during your available times.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {DAYS_OF_WEEK.map((day, index) => (
              <div 
                key={day} 
                className={`p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors 
                  ${selectedDay === index ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                onClick={() => setSelectedDay(index)}
              >
                <h3 className="font-medium">{day}</h3>
                <div className="mt-2 text-sm">
                  {renderDaySummary(index)}
                </div>
              </div>
            ))}
          </div>
          
          {selectedDay !== null && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">
                Set availability for {DAYS_OF_WEEK[selectedDay]}
              </h3>
              
              <div className="flex items-center space-x-2 mb-6">
                <Switch 
                  id="available" 
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                />
                <Label htmlFor="available">Available for appointments</Label>
              </div>
              
              {isAvailable && (
                <div className="space-y-4">
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>From</span>
                      </div>
                      
                      <Select
                        value={slot.startTime}
                        onValueChange={(value) => handleTimeChange(index, 'startTime', value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center space-x-2">
                        <span>to</span>
                      </div>
                      
                      <Select
                        value={slot.endTime}
                        onValueChange={(value) => handleTimeChange(index, 'endTime', value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {timeSlots.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTimeSlot(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTimeSlot}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add time slot
                  </Button>
                </div>
              )}
              
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  onClick={saveAvailability}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save for {DAYS_OF_WEEK[selectedDay]}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={updateAllDaysAtOnce}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Apply to all days
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAvailabilityCalendar;
