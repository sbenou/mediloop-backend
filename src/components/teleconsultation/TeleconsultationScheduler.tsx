
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, setHours, setMinutes, isAfter, isBefore, addMinutes } from 'date-fns';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface TeleconsultationSchedulerProps {
  doctorId: string;
  doctorName: string;
  onScheduled: () => void;
}

const CONSULTATION_DURATION = 30; // in minutes
const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 17; // 5 PM

type TimeSlot = {
  hour: number;
  minute: number;
  formatted: string;
  disabled: boolean;
};

const TeleconsultationScheduler: React.FC<TeleconsultationSchedulerProps> = ({ 
  doctorId, 
  doctorName,
  onScheduled 
}) => {
  const { profile } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState<string>('');

  // Generate time slots for the selected date
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const now = new Date();
    const isToday = date && date.toDateString() === now.toDateString();
    
    // Create slots from business hours start to end, in 30-minute increments
    for (let hour = BUSINESS_HOURS_START; hour < BUSINESS_HOURS_END; hour++) {
      for (let minute of [0, 30]) {
        const slotTime = date ? setMinutes(setHours(new Date(date), hour), minute) : new Date();
        
        // Disable past time slots if the selected date is today
        const disabled = isToday && isBefore(slotTime, now);
        
        slots.push({
          hour,
          minute,
          formatted: format(slotTime, 'h:mm a'),
          disabled
        });
      }
    }
    
    return slots;
  };

  const timeSlots = date ? generateTimeSlots() : [];

  const handleScheduleConsultation = async () => {
    if (!date || !timeSlot || !doctorId || !profile?.id) {
      toast({ 
        title: "Missing information", 
        description: "Please select both date and time for your consultation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Parse the selected time
    const [hourStr, minuteStr] = timeSlot.split(':');
    const isPM = timeSlot.toLowerCase().includes('pm');
    let hour = parseInt(hourStr);
    if (isPM && hour < 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    const minute = parseInt(minuteStr);

    // Create the start time and end time (30 minutes later)
    const startTime = setMinutes(setHours(new Date(date), hour), minute);
    const endTime = addMinutes(startTime, CONSULTATION_DURATION);

    try {
      // Check if the doctor already has a consultation at this time
      const { data: existingConsultations, error: checkError } = await supabase
        .from('teleconsultations')
        .select('*')
        .eq('doctor_id', doctorId)
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString());

      if (checkError) throw checkError;

      if (existingConsultations && existingConsultations.length > 0) {
        toast({
          title: "Time slot unavailable",
          description: "The doctor already has a consultation scheduled during this time. Please select another time.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Create the new consultation
      const { data, error } = await supabase
        .from('teleconsultations')
        .insert({
          patient_id: profile.id,
          doctor_id: doctorId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending',
          reason: reason || 'General consultation'
        })
        .select()
        .single();

      if (error) throw error;

      // Create a notification for the doctor
      await supabase
        .from('notifications')
        .insert({
          user_id: doctorId,
          type: 'teleconsultation_request',
          title: 'New Teleconsultation Request',
          message: `${profile.full_name} has requested a teleconsultation on ${format(startTime, 'PPP')} at ${format(startTime, 'p')}`,
          link: '/dashboard?view=teleconsultations'
        });

      toast({
        title: "Consultation Requested",
        description: `Your consultation with Dr. ${doctorName} has been requested for ${format(startTime, 'PPP')} at ${format(startTime, 'p')}. You will be notified when the doctor confirms.`
      });

      onScheduled();
    } catch (error) {
      console.error('Error scheduling consultation:', error);
      toast({
        title: "Failed to schedule consultation",
        description: "There was an error scheduling your consultation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Teleconsultation</CardTitle>
        <CardDescription>
          Book a teleconsultation with Dr. {doctorName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => 
              date < new Date() || // Can't book in the past
              date > addDays(new Date(), 30) // Can only book up to 30 days in advance
            }
            className="border rounded-md p-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Time</label>
          <Select onValueChange={setTimeSlot} value={timeSlot || undefined}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot, index) => (
                <SelectItem 
                  key={index} 
                  value={slot.formatted}
                  disabled={slot.disabled}
                >
                  {slot.formatted}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Reason for consultation</label>
          <textarea 
            className="w-full min-h-[100px] p-2 border rounded-md"
            placeholder="Please briefly describe the reason for your consultation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleScheduleConsultation} 
          disabled={!date || !timeSlot || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Scheduling..." : "Request Consultation"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TeleconsultationScheduler;
