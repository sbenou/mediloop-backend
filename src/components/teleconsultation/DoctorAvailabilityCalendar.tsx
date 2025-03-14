import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, X, Save, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { DoctorAvailability, TimeSlot } from "@/types/supabase";

interface DoctorAvailabilityCalendarProps {
  doctorId: string;
  doctorName?: string;
  onBookingConfirmed?: () => void;
  isManagementMode?: boolean;
}

// Define constant for days of week
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
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load doctor's availability settings
  useEffect(() => {
    if (doctorId) {
      loadAvailability();
    }
  }, [doctorId]);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      console.log('Loading availability for doctor:', doctorId);
      
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId);
      
      if (error) {
        console.error('Error fetching doctor availability:', error);
        setLoadError('Failed to load availability data');
        throw error;
      }
      
      console.log('Received doctor availability data:', data);
      
      if (data && data.length > 0) {
        // Transform data to include time_slots array
        const processedData: DoctorAvailability[] = data.map(item => {
          console.log('Processing availability item:', item);
          
          // Parse any stored time slots or create default
          const defaultSlot = {
            startTime: item.start_time || '09:00',
            endTime: item.end_time || '17:00'
          };
          
          // If additional_time_slots exists, parse it
          let allTimeSlots = [defaultSlot];
          let additionalTimeSlots: string | null = null;
          
          try {
            // Handle additional_time_slots if it exists in the database
            // TypeScript now knows the property exists on our updated interface
            if ('additional_time_slots' in item && item.additional_time_slots) {
              console.log('Parsing additional time slots:', item.additional_time_slots);
              // Handle both string and already parsed object
              if (typeof item.additional_time_slots === 'string') {
                const parsedSlots = JSON.parse(item.additional_time_slots);
                if (Array.isArray(parsedSlots)) {
                  allTimeSlots = [defaultSlot, ...parsedSlots];
                }
                additionalTimeSlots = item.additional_time_slots;
              } else if (Array.isArray(item.additional_time_slots)) {
                allTimeSlots = [defaultSlot, ...item.additional_time_slots];
                additionalTimeSlots = JSON.stringify(item.additional_time_slots);
              }
            }
          } catch (e) {
            console.error('Error parsing additional time slots:', e);
          }
          
          return {
            id: item.id,
            doctor_id: item.doctor_id,
            day_of_week: item.day_of_week,
            start_time: item.start_time,
            end_time: item.end_time,
            is_available: item.is_available,
            created_at: item.created_at,
            updated_at: item.updated_at,
            additional_time_slots: additionalTimeSlots,
            time_slots: allTimeSlots
          } as DoctorAvailability;
        });
        
        console.log('Processed availability data:', processedData);
        setAvailabilityData(processedData);
      } else {
        console.log('No availability data found, creating defaults');
        // Initialize default availability for all days if none exists
        const defaultAvailability: DoctorAvailability[] = DAYS_OF_WEEK.map((_, index) => ({
          id: `temp-${index}`,
          doctor_id: doctorId,
          day_of_week: index,
          start_time: '09:00',
          end_time: '17:00',
          is_available: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          additional_time_slots: null,
          time_slots: [{
            startTime: '09:00',
            endTime: '17:00'
          }]
        }));
        setAvailabilityData(defaultAvailability);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setLoadError('Failed to load availability data');
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
        setIsAvailable(currentDayData.is_available || false);
        
        // Set time slots if they exist in the data
        if (currentDayData.time_slots && currentDayData.time_slots.length > 0) {
          console.log('Setting time slots from data:', currentDayData.time_slots);
          setTimeSlots(currentDayData.time_slots);
        } else if (currentDayData.start_time && currentDayData.end_time) {
          // Create a single time slot from start and end times
          console.log('Creating time slot from start/end times:', currentDayData.start_time, currentDayData.end_time);
          setTimeSlots([{
            startTime: currentDayData.start_time,
            endTime: currentDayData.end_time
          }]);
        } else {
          // Default time slot
          console.log('Using default time slot');
          setTimeSlots([{
            startTime: '09:00',
            endTime: '17:00'
          }]);
        }
      } else {
        // Default values if no data for this day
        console.log('No data for selected day, using defaults');
        setIsAvailable(false);
        setTimeSlots([{
          startTime: '09:00',
          endTime: '17:00'
        }]);
      }
    }
  }, [selectedDay, availabilityData]);

  const handleTimeChange = (index: number, type: 'startTime' | 'endTime', value: string) => {
    try {
      const newTimeSlots = [...timeSlots];
      newTimeSlots[index] = {
        ...newTimeSlots[index],
        [type]: value
      };
      setTimeSlots(newTimeSlots);
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast({
        variant: "destructive",
        title: "Error updating time",
        description: "Failed to update time slot. Please try again."
      });
    }
  };

  const addTimeSlot = () => {
    try {
      const newTimeSlots = [...timeSlots];
      newTimeSlots.push({
        startTime: '13:00',
        endTime: '17:00'
      });
      setTimeSlots(newTimeSlots);
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast({
        variant: "destructive",
        title: "Error adding time slot",
        description: "Failed to add a new time slot. Please try again."
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    try {
      if (timeSlots.length > 1) {
        const newTimeSlots = timeSlots.filter((_, i) => i !== index);
        setTimeSlots(newTimeSlots);
      }
    } catch (error) {
      console.error('Error removing time slot:', error);
      toast({
        variant: "destructive",
        title: "Error removing time slot",
        description: "Failed to remove time slot. Please try again."
      });
    }
  };

  const validateTimeSlots = () => {
    // Check for overlapping time slots
    for (let i = 0; i < timeSlots.length; i++) {
      const slot1 = timeSlots[i];
      
      // Check if start time is before end time
      if (slot1.startTime >= slot1.endTime) {
        toast({
          variant: "destructive",
          title: "Invalid time slot",
          description: `Time slot ${i+1} has start time after or equal to end time.`
        });
        return false;
      }
      
      // Check for overlaps with other slots
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot2 = timeSlots[j];
        
        if ((slot1.startTime <= slot2.endTime && slot1.endTime >= slot2.startTime) ||
            (slot2.startTime <= slot1.endTime && slot2.endTime >= slot1.startTime)) {
          toast({
            variant: "destructive",
            title: "Overlapping time slots",
            description: `Time slots ${i+1} and ${j+1} overlap. Please adjust the times.`
          });
          return false;
        }
      }
    }
    return true;
  };

  const saveAvailability = async () => {
    if (selectedDay === null) {
      toast({
        title: "Select a day",
        description: "Please select a day of the week to set availability."
      });
      return;
    }

    if (isAvailable && !validateTimeSlots()) {
      return;
    }

    try {
      setIsSaving(true);
      console.log('Saving availability for day:', DAYS_OF_WEEK[selectedDay]);

      // We'll just use the first time slot for the main start/end time fields
      // for backward compatibility
      const primaryTimeSlot = timeSlots[0];
      const additionalTimeSlots = timeSlots.length > 1 ? timeSlots.slice(1) : [];
      
      console.log('Saving time slots:', timeSlots);
      console.log('Additional time slots:', additionalTimeSlots);

      // Find existing record for this day
      const existingDay = availabilityData.find(day => day.day_of_week === selectedDay);
      
      if (existingDay?.id && !existingDay.id.includes('temp-')) {
        // Update existing record
        console.log('Updating existing availability record:', existingDay.id);
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
          
        if (error) {
          console.error('Error updating availability:', error);
          throw error;
        }
        
        console.log('Successfully updated availability');
      } else {
        // Insert new record
        console.log('Creating new availability record');
        const { error, data } = await supabase
          .from('doctor_availability')
          .insert([{
            doctor_id: doctorId,
            day_of_week: selectedDay,
            start_time: primaryTimeSlot.startTime,
            end_time: primaryTimeSlot.endTime,
            additional_time_slots: additionalTimeSlots.length > 0 ? JSON.stringify(additionalTimeSlots) : null,
            is_available: isAvailable
          }])
          .select();
          
        if (error) {
          console.error('Error creating availability:', error);
          throw error;
        }
        
        console.log('Successfully created availability:', data);
      }

      // Reload data after update
      await loadAvailability();
      
      toast({
        title: "Availability saved",
        description: `Your availability for ${DAYS_OF_WEEK[selectedDay]} has been updated.`
      });
      
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
      if (isAvailable && !validateTimeSlots()) {
        return;
      }
      
      setIsSaving(true);
      console.log('Updating availability for all days');
      
      // First, delete all existing availability records
      const { error: deleteError } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('doctor_id', doctorId);
        
      if (deleteError) {
        console.error('Error deleting existing availability:', deleteError);
        throw deleteError;
      }
      
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
      
      console.log('Creating availability records for all days:', newAvailabilityRecords);
      
      const { error: insertError } = await supabase
        .from('doctor_availability')
        .insert(newAvailabilityRecords);
        
      if (insertError) {
        console.error('Error creating availability records:', insertError);
        throw insertError;
      }
      
      // Reload the data to ensure we have the correct IDs and timestamps
      await loadAvailability();
      
      toast({
        title: "Availability updated",
        description: "Your availability for all days has been updated."
      });
      
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
    if ('additional_time_slots' in dayData && dayData.additional_time_slots) {
      try {
        const additionalSlots = typeof dayData.additional_time_slots === 'string' 
          ? JSON.parse(dayData.additional_time_slots)
          : dayData.additional_time_slots;
          
        if (additionalSlots && Array.isArray(additionalSlots) && additionalSlots.length > 0) {
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

  if (loadError) {
    return (
      <div className="p-4 border rounded-md border-red-200 bg-red-50">
        <h3 className="text-red-700 font-medium">Error Loading Availability</h3>
        <p className="text-red-600">{loadError}</p>
        <Button 
          variant="outline" 
          onClick={loadAvailability} 
          className="mt-2"
        >
          Try Again
        </Button>
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
                          type="button"
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
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add time slot
                  </Button>
                </div>
              )}
              
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  onClick={saveAvailability}
                  disabled={isSaving}
                  type="button"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save for {DAYS_OF_WEEK[selectedDay]}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={updateAllDaysAtOnce}
                  disabled={isSaving}
                  type="button"
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
