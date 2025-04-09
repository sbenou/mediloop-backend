
import { useState, useEffect } from "react";
import { format, setMinutes, setHours, addHours } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Define validation schema
export const bookingSchema = z.object({
  title: z.string({
    required_error: "A title is required",
  }).min(3, {
    message: "Title must be at least 3 characters long",
  }),
  date: z.date({
    required_error: "A date is required",
  }),
  time: z.string({
    required_error: "A time is required",
  }),
  patientId: z.string({
    required_error: "A patient is required",
  }),
  reason: z.string().min(5, {
    message: "Reason must be at least 5 characters",
  }).max(500, {
    message: "Reason must not be more than 500 characters",
  }),
  duration: z.number().min(10, {
    message: "Duration must be at least 10 minutes",
  }).max(120, {
    message: "Duration must not be more than 120 minutes",
  }),
  reminder: z.string(),
});

// Define reminder options
export const REMINDER_OPTIONS = [
  { value: "none", label: "Don't remind me" },
  { value: "at_time", label: "At time of event" },
  { value: "5min", label: "5 minutes before" },
  { value: "15min", label: "15 minutes before" },
  { value: "30min", label: "30 minutes before" },
  { value: "1hour", label: "1 hour before" },
  { value: "2hours", label: "2 hours before" },
  { value: "12hours", label: "12 hours before" },
  { value: "1day", label: "1 day before" },
  { value: "1week", label: "1 week before" }
];

// Generate time options
export const generateTimeOptions = () => {
  const times = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      times.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return times;
};

export const TIME_OPTIONS = generateTimeOptions();

interface UseBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  patients?: Array<{ id: string, name: string, email?: string }>;
  onBookingCreated?: () => void;
  appointmentType?: 'teleconsultation' | 'in-person';
}

export const useBookingDialog = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  doctorId,
  patients = [],
  onBookingCreated,
  appointmentType = 'teleconsultation'
}: UseBookingDialogProps) => {
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [time, setTime] = useState<string | undefined>(selectedTime);
  const [patientId, setPatientId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [reminder, setReminder] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Populate fields if values are provided
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
    // Set first patient as default if available
    if (patients.length > 0 && !patientId) {
      setPatientId(patients[0].id);
    }
  }, [selectedDate, selectedTime, patients, patientId]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form data
      if (!title || !date || !time || !patientId || !reason) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please fill in all required fields."
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Create start and end time by combining date and time
      const [hours, minutes] = time.split(':').map(Number);
      const startDateTime = setMinutes(setHours(date, hours), minutes);
      const endDateTime = addHours(startDateTime, duration / 60);
      
      // Create the teleconsultation record
      const { data, error } = await supabase
        .from('teleconsultations')
        .insert([
          {
            doctor_id: doctorId,
            patient_id: patientId,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            reason: title,
            status: 'confirmed',
            meta: {
              appointment_type: appointmentType,
              is_teleconsultation: appointmentType === 'teleconsultation',
              is_in_person: appointmentType === 'in-person',
              duration_minutes: duration,
              details: reason,
              reminder: reminder
            }
          }
        ])
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Appointment created",
        description: `Your ${appointmentType} appointment has been successfully scheduled.`
      });
      
      // Call the callback if provided
      if (onBookingCreated) {
        onBookingCreated();
      }
      
      // Close the dialog
      onClose();
      
    } catch (error) {
      console.error('Error creating teleconsultation:', error);
      toast({
        variant: "destructive",
        title: "Failed to create appointment",
        description: "There was an error scheduling your appointment. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAppointmentTypeTitle = () => {
    return appointmentType === 'teleconsultation' 
      ? 'Schedule Teleconsultation'
      : 'Schedule In-Person Appointment';
  };

  return {
    title,
    setTitle,
    date,
    setDate,
    time,
    setTime,
    patientId,
    setPatientId,
    reason,
    setReason,
    duration,
    setDuration,
    reminder,
    setReminder,
    isSubmitting,
    activeTab,
    handleTabChange,
    handleSubmit,
    getAppointmentTypeTitle
  };
};
