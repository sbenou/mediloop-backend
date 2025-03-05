
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, addHours, isWeekend, isBefore } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { TeleconsultationStatus } from '@/types/supabase';

interface TeleconsultationSchedulerProps {
  doctorId: string;
  doctorName: string;
  onScheduled: () => void;
}

// Define consult time slot interface
interface TimeSlot {
  label: string;
  value: Date;
  disabled: boolean;
}

const TeleconsultationScheduler: React.FC<TeleconsultationSchedulerProps> = ({ 
  doctorId, 
  doctorName, 
  onScheduled 
}) => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [existingConsultations, setExistingConsultations] = useState<{
    start_time: string;
    end_time: string;
  }[]>([]);

  // Fetch existing teleconsultations when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchExistingConsultations();
    }
  }, [selectedDate, doctorId]);

  // Generate time slots when date or existing consultations change
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, existingConsultations]);

  const fetchExistingConsultations = async () => {
    if (!selectedDate || !doctorId) return;

    try {
      // Set start of day and end of day for query
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('teleconsultations')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('status', 'confirmed')
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());

      if (error) throw error;

      setExistingConsultations(data || []);
    } catch (error) {
      console.error('Error fetching existing consultations:', error);
    }
  };

  const generateTimeSlots = () => {
    if (!selectedDate) return;

    const slots: TimeSlot[] = [];
    const now = new Date();
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const intervalMinutes = 30; // 30-minute intervals

    // Create a set of booked time slots for quick lookup
    const bookedSlots = new Set(
      existingConsultations.map(consultation => 
        new Date(consultation.start_time).toISOString()
      )
    );

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip if the time slot is in the past
        if (isBefore(slotTime, now)) {
          continue;
        }
        
        // Check if this slot conflicts with existing consultations
        const isBooked = bookedSlots.has(slotTime.toISOString());
        
        slots.push({
          label: format(slotTime, 'h:mm a'),
          value: slotTime,
          disabled: isBooked
        });
      }
    }

    setTimeSlots(slots);

    // Reset selected time slot when date changes
    setSelectedTimeSlot(null);
  };

  const handleSchedule = async () => {
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
      // Calculate end time (30 minutes after start)
      const endTime = addMinutes(selectedTimeSlot.value, 30);

      const { error } = await supabase
        .from('teleconsultations')
        .insert({
          patient_id: profile.id,
          doctor_id: doctorId,
          start_time: selectedTimeSlot.value.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending' as TeleconsultationStatus,
          reason: reason.trim() || 'General consultation'
        });

      if (error) throw error;

      // Create notification for the doctor
      await supabase
        .from('notifications')
        .insert({
          user_id: doctorId,
          title: 'New Teleconsultation Request',
          message: `${profile.full_name} has requested a teleconsultation on ${format(selectedTimeSlot.value, 'PPP')} at ${format(selectedTimeSlot.value, 'p')}.`,
          type: 'teleconsultation_request',
          link: '/dashboard?view=teleconsultations'
        });

      toast({
        title: "Request sent",
        description: `Your teleconsultation request with Dr. ${doctorName} has been sent successfully.`,
      });

      onScheduled();
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

  // Helper function to add minutes to a date
  const addMinutes = (date: Date, minutes: number) => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  };

  // Disable past dates and weekends
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || isWeekend(date);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Request Teleconsultation with Dr. {doctorName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">1. Select a date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className="rounded-md border"
              defaultMonth={new Date()}
              initialFocus
            />
          </div>

          {selectedDate && (
            <div>
              <h3 className="text-lg font-medium mb-2">2. Select a time</h3>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {timeSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedTimeSlot?.label === slot.label ? "default" : "outline"}
                      disabled={slot.disabled}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className="w-full"
                    >
                      {slot.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No available time slots for this date.</p>
              )}
            </div>
          )}

          {selectedTimeSlot && (
            <div>
              <h3 className="text-lg font-medium mb-2">3. Reason for consultation</h3>
              <Textarea
                placeholder="Please describe your symptoms or reason for the consultation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          {selectedDate && selectedTimeSlot && (
            <Button 
              onClick={handleSchedule} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Request Appointment"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeleconsultationScheduler;
