import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';
import { format, isBefore, isEqual, addMinutes, isToday, addDays } from 'date-fns';
import { Clock, Calendar as CalendarIcon, ChevronRight, ChevronLeft, AlertTriangle, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string; // e.g., "09:00"
  end_time: string; // e.g., "17:00"
  is_available: boolean;
}

interface Booking {
  id: string;
  start_time: Date;
  end_time: Date;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

interface DoctorAvailabilityCalendarProps {
  doctorId: string;
  doctorName: string;
  onBookingConfirmed: () => void;
  isManagementMode?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DoctorAvailabilityCalendar: React.FC<DoctorAvailabilityCalendarProps> = ({
  doctorId,
  doctorName,
  onBookingConfirmed,
  isManagementMode = false
}) => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<string>(isManagementMode ? 'manage' : 'book');
  
  // State for availability management
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [availabilityEdits, setAvailabilityEdits] = useState<DoctorAvailability[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorAvailability();
    }
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchExistingBookings();
    }
  }, [selectedDate, doctorId]);

  useEffect(() => {
    if (selectedDate && doctorAvailability.length > 0) {
      generateTimeSlots();
    }
  }, [selectedDate, doctorAvailability, existingBookings]);

  const fetchDoctorAvailability = async () => {
    setAvailabilityLoading(true);
    try {
      // Try to fetch doctor availability from the database
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId);
      
      if (error) throw error;
      
      // If doctor has availability settings, use them
      if (data && data.length > 0) {
        setDoctorAvailability(data);
        setAvailabilityEdits(JSON.parse(JSON.stringify(data))); // Deep copy for editing
      } else {
        // Otherwise, generate default availability (9-5 on weekdays)
        const defaultAvailability: DoctorAvailability[] = [];
        
        for (let day = 0; day < 7; day++) {
          defaultAvailability.push({
            id: `default-${day}`,
            doctor_id: doctorId,
            day_of_week: day,
            start_time: day === 0 || day === 6 ? "" : "09:00",
            end_time: day === 0 || day === 6 ? "" : "17:00",
            is_available: !(day === 0 || day === 6) // Not available on weekends
          });
        }
        
        setDoctorAvailability(defaultAvailability);
        setAvailabilityEdits(JSON.parse(JSON.stringify(defaultAvailability))); // Deep copy for editing
      }
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor availability",
        variant: "destructive"
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const fetchExistingBookings = async () => {
    if (!selectedDate) return;
    
    setBookingsLoading(true);
    try {
      // Get the start and end of the selected day
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Query existing confirmed teleconsultations for this doctor on the selected day
      const { data, error } = await supabase
        .from('teleconsultations')
        .select('id, start_time, end_time')
        .eq('doctor_id', doctorId)
        .in('status', ['confirmed', 'pending'])
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
      
      if (error) throw error;
      
      if (data) {
        const bookings: Booking[] = data.map(booking => ({
          id: booking.id,
          start_time: new Date(booking.start_time),
          end_time: new Date(booking.end_time)
        }));
        
        setExistingBookings(bookings);
      }
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor's schedule",
        variant: "destructive"
      });
    } finally {
      setBookingsLoading(false);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate || doctorAvailability.length === 0) return;
    
    const slots: TimeSlot[] = [];
    const now = new Date();
    const dayOfWeek = selectedDate.getDay();
    
    // Find the doctor's availability for the selected day
    const availability = doctorAvailability.find(a => a.day_of_week === dayOfWeek);
    
    if (!availability || !availability.is_available || !availability.start_time || !availability.end_time) {
      setTimeSlots([]);
      return;
    }
    
    // Parse the start and end times
    const [startHour, startMinute] = availability.start_time.split(':').map(Number);
    const [endHour, endMinute] = availability.end_time.split(':').map(Number);
    
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    // Generate 30-minute slots within the available hours
    const slotDuration = 30; // minutes
    let currentSlotStart = new Date(startDateTime);
    
    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);
      
      // Check if the slot is in the past
      const isInPast = currentSlotStart < now && isToday(currentSlotStart);
      
      // Check if the slot overlaps with any existing bookings
      const isOverlapping = existingBookings.some(booking => {
        const bookingStart = booking.start_time;
        const bookingEnd = booking.end_time;
        
        return (
          (currentSlotStart >= bookingStart && currentSlotStart < bookingEnd) ||
          (currentSlotEnd > bookingStart && currentSlotEnd <= bookingEnd) ||
          (currentSlotStart <= bookingStart && currentSlotEnd >= bookingEnd)
        );
      });
      
      slots.push({
        startTime: new Date(currentSlotStart),
        endTime: new Date(currentSlotEnd),
        available: !isInPast && !isOverlapping
      });
      
      // Move to the next slot
      currentSlotStart = new Date(currentSlotEnd);
    }
    
    setTimeSlots(slots);
    
    // Reset selected time slot when date changes
    setSelectedTimeSlot(null);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot || !profile?.id || !doctorId) {
      toast({
        title: "Missing information",
        description: "Please select a date, time, and provide a reason for the consultation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('teleconsultations')
        .insert({
          patient_id: profile.id,
          doctor_id: doctorId,
          start_time: selectedTimeSlot.startTime.toISOString(),
          end_time: selectedTimeSlot.endTime.toISOString(),
          status: 'pending',
          reason: reason.trim() || 'General consultation'
        });

      if (error) throw error;

      // Create notification for the doctor
      await supabase
        .from('notifications')
        .insert({
          user_id: doctorId,
          title: 'New Teleconsultation Request',
          message: `${profile.full_name} has requested a teleconsultation on ${format(selectedTimeSlot.startTime, 'PPP')} at ${format(selectedTimeSlot.startTime, 'p')}.`,
          type: 'teleconsultation_request',
          link: '/dashboard?view=teleconsultations'
        });

      toast({
        title: "Request sent",
        description: `Your teleconsultation request with Dr. ${doctorName} has been sent successfully.`,
      });

      onBookingConfirmed();
    } catch (error) {
      console.error('Error scheduling teleconsultation:', error);
      toast({
        title: "Failed to schedule",
        description: "There was an error scheduling your teleconsultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle changes in availability during editing
  const handleAvailabilityChange = (dayIndex: number, field: keyof DoctorAvailability, value: any) => {
    setAvailabilityEdits(prev => 
      prev.map((day, i) => 
        i === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  // Function to save availability changes to the database
  const saveAvailabilityChanges = async () => {
    setSavingAvailability(true);
    try {
      // Check if we have availability records in the database
      const { data, error: checkError } = await supabase
        .from('doctor_availability')
        .select('id')
        .eq('doctor_id', doctorId)
        .limit(1);
      
      if (checkError) throw checkError;
      
      // If there are existing records, update them
      if (data && data.length > 0) {
        // Delete existing records first
        const { error: deleteError } = await supabase
          .from('doctor_availability')
          .delete()
          .eq('doctor_id', doctorId);
        
        if (deleteError) throw deleteError;
      }
      
      // Insert the new availability settings
      const recordsToInsert = availabilityEdits.map(avail => ({
        doctor_id: doctorId,
        day_of_week: avail.day_of_week,
        start_time: avail.start_time,
        end_time: avail.end_time,
        is_available: avail.is_available
      }));
      
      const { error: insertError } = await supabase
        .from('doctor_availability')
        .insert(recordsToInsert);
      
      if (insertError) throw insertError;
      
      // Update local state with the saved data
      setDoctorAvailability(availabilityEdits);
      setEditingAvailability(false);
      
      toast({
        title: "Availability updated",
        description: "Your availability settings have been saved successfully."
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "There was an error saving your availability settings. Please try again."
      });
    } finally {
      setSavingAvailability(false);
    }
  };

  // Disable past dates and function to check if a day is available
  const isDayAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const availability = doctorAvailability.find(a => a.day_of_week === dayOfWeek);
    return availability?.is_available && availability?.start_time && availability?.end_time;
  };
  
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // The doctor cannot edit past dates
    if (isManagementMode) {
      return isBefore(date, today);
    }
    
    return isBefore(date, today) || !isDayAvailable(date);
  };

  // Render the availability management section
  const renderAvailabilityManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Your Weekly Availability</h3>
          {!editingAvailability ? (
            <Button onClick={() => setEditingAvailability(true)}>
              <Edit className="h-4 w-4 mr-2" /> Edit Availability
            </Button>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => {
                setAvailabilityEdits(JSON.parse(JSON.stringify(doctorAvailability)));
                setEditingAvailability(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={saveAvailabilityChanges} 
                disabled={savingAvailability}
              >
                {savingAvailability ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-4">
          {availabilityEdits.map((day, index) => (
            <Card key={day.day_of_week}>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center justify-between sm:justify-start sm:w-48">
                    <span className="font-medium w-28">{DAYS_OF_WEEK.find(d => d.value === day.day_of_week)?.label}</span>
                    <div className="flex items-center">
                      <Switch
                        id={`available-${day.day_of_week}`}
                        checked={day.is_available}
                        onCheckedChange={(checked) => handleAvailabilityChange(index, 'is_available', checked)}
                        disabled={!editingAvailability}
                      />
                      <Label htmlFor={`available-${day.day_of_week}`} className="ml-2">
                        {day.is_available ? 'Available' : 'Unavailable'}
                      </Label>
                    </div>
                  </div>
                  
                  {day.is_available && (
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs mb-1 block">Start time</label>
                          <Select
                            value={day.start_time}
                            onValueChange={(value) => handleAvailabilityChange(index, 'start_time', value)}
                            disabled={!editingAvailability}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }).map((_, hour) => (
                                <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                  {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour-12}:00 PM`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block">End time</label>
                          <Select
                            value={day.end_time}
                            onValueChange={(value) => handleAvailabilityChange(index, 'end_time', value)}
                            disabled={!editingAvailability}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }).map((_, hour) => (
                                <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                                  {hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour-12}:00 PM`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {editingAvailability && (
          <div className="bg-yellow-50 p-4 rounded-md text-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-800">
                Changes to your availability may affect existing appointments. Patients will be notified of any changes that affect their appointments.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render the booking calendar section
  const renderBookingCalendar = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">1. Select a date</h3>
          <div className="border rounded-md p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className="rounded-md"
              initialFocus
            />
          </div>
        </div>

        {selectedDate && (
          <div>
            <h3 className="text-lg font-medium mb-4">2. Select an available time slot</h3>
            
            {bookingsLoading ? (
              <Skeleton className="h-[100px] w-full" />
            ) : (
              <>
                {timeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {timeSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`
                          w-full ${slot.available ? 'hover:bg-green-50 border-green-200' : 'bg-red-50 border-red-200 opacity-50 cursor-not-allowed'}
                          ${selectedTimeSlot && isEqual(selectedTimeSlot.startTime, slot.startTime) ? 'bg-green-100 border-green-400' : ''}
                        `}
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot)}
                      >
                        <Clock className="h-4 w-4 mr-2" /> 
                        {format(slot.startTime, 'h:mm a')}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 border rounded-md bg-gray-50">
                    <CalendarIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-muted-foreground">No available time slots for this date.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please select another date or contact the doctor.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {selectedTimeSlot && (
          <div>
            <h3 className="text-lg font-medium mb-4">3. Reason for consultation</h3>
            <Textarea
              placeholder="Please describe your symptoms or reason for the consultation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        )}
        
        {selectedTimeSlot && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Selected appointment:</p>
                <p className="text-gray-700">
                  {format(selectedTimeSlot.startTime, 'PPPP')}
                </p>
                <p className="text-gray-700">
                  {format(selectedTimeSlot.startTime, 'h:mm a')} - {format(selectedTimeSlot.endTime, 'h:mm a')}
                </p>
              </div>
              <Button 
                onClick={handleBookAppointment} 
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Submitting..." : "Request Appointment"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="bg-yellow-50 p-3 rounded-md text-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-800">
                  Your request will be sent to Dr. {doctorName} for approval. You'll receive a notification once they respond.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isManagementMode ? 
              "Manage Your Availability" : 
              `Book Teleconsultation with Dr. ${doctorName}`
            }
          </CardTitle>
          <CardDescription>
            {isManagementMode ?
              "Set your weekly availability for teleconsultations and manage your schedule." :
              `Select an available time slot from Dr. ${doctorName}'s calendar. Green slots are available, red slots are already booked.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {availabilityLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <>
              {isManagementMode ? (
                <Tabs defaultValue="manage" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="manage">Weekly Schedule</TabsTrigger>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="manage">
                    {renderAvailabilityManagement()}
                  </TabsContent>
                  
                  <TabsContent value="calendar">
                    {renderBookingCalendar()}
                  </TabsContent>
                </Tabs>
              ) : (
                renderBookingCalendar()
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAvailabilityCalendar;
