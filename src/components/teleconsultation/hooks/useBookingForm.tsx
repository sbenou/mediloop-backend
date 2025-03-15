
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parse, addHours } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { createNotification } from "@/utils/notifications";

// Define validation schema for form
const bookingFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reminder: z.string(),
  location: z.string(),
  patientId: z.string().uuid({ message: "Please select a patient" })
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

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

// Time options for the select dropdown
export const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

interface UseBookingFormProps {
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  doctorLocation?: string;
  patients: Array<{ id: string; name: string }>;
  onBookingCreated: () => void;
  onClose: () => void;
}

export const useBookingForm = ({
  selectedDate,
  selectedTime,
  doctorId,
  doctorLocation = "Doctor's office",
  patients,
  onBookingCreated,
  onClose
}: UseBookingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a unique room ID for the teleconsultation
  const roomId = `consultation-${crypto.randomUUID().substring(0, 8)}`;
  
  // Default message template with Jitsi link
  const defaultDescription = `This is a teleconsultation appointment. Please join the call using the following link:\n\nhttps://meet.jit.si/${roomId}\n\nJoin a few minutes before the appointment time. If you have any issues, please contact the office.`;

  // Initialize form with defaults
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "Teleconsultation Appointment",
      description: defaultDescription,
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: selectedTime || "09:00",
      endTime: selectedTime ? 
        format(addHours(parse(selectedTime, 'HH:mm', new Date()), 1), 'HH:mm') : 
        "10:00",
      reminder: "15min",
      location: doctorLocation,
      patientId: ""
    }
  });

  const handleSubmit = async (values: BookingFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Parse date and times to create start and end datetime
      const startDateTime = new Date(`${values.date}T${values.startTime}`);
      const endDateTime = new Date(`${values.date}T${values.endTime}`);
      
      // Create the teleconsultation in the database
      const { data, error } = await supabase
        .from('teleconsultations')
        .insert({
          patient_id: values.patientId,
          doctor_id: doctorId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
          reason: values.title,
          room_id: roomId
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Find patient name for notification
      const patient = patients.find(p => p.id === values.patientId);
      
      // Create notification for the doctor
      await createNotification({
        userId: doctorId,
        type: "new_teleconsultation",
        title: "New Teleconsultation Booked",
        message: `You have scheduled a teleconsultation with ${patient?.name} on ${format(startDateTime, 'MMMM d, yyyy')} at ${format(startDateTime, 'h:mm a')}`,
        link: `/dashboard?view=teleconsultations`,
        meta: {
          consultationId: data.id,
          reminder: values.reminder
        }
      });
      
      // Create notification for the patient
      await createNotification({
        userId: values.patientId,
        type: "new_teleconsultation",
        title: "New Teleconsultation Scheduled",
        message: `A doctor has scheduled a teleconsultation for you on ${format(startDateTime, 'MMMM d, yyyy')} at ${format(startDateTime, 'h:mm a')}`,
        link: `/dashboard?view=teleconsultations`,
        meta: {
          consultationId: data.id,
          reminder: values.reminder
        }
      });
      
      toast({
        title: "Appointment Scheduled",
        description: `Teleconsultation has been scheduled and notifications sent.`,
      });
      
      onBookingCreated();
      onClose();
    } catch (error) {
      console.error("Error booking teleconsultation:", error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: "There was a problem booking the teleconsultation. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    handleSubmit,
    roomId
  };
};
