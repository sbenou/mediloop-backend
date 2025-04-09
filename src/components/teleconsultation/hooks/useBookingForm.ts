
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addHours, parse } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { 
  BookingFormValues, 
  bookingFormSchema,
  UseBookingFormProps 
} from "./types/bookingTypes";
import {
  generateRoomId,
  generateDefaultDescription,
  formatBookingDates,
  createTeleconsultation,
  createBookingNotifications
} from "./utils/bookingUtils";

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

  // Generate room ID
  const roomId = generateRoomId();
  
  // Get default description
  const defaultDescription = generateDefaultDescription(roomId);

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
      const { startDateTime, endDateTime } = formatBookingDates(
        values.date, 
        values.startTime, 
        values.endTime
      );
      
      // Create the teleconsultation in the database
      const data = await createTeleconsultation(values, doctorId, roomId, patients);
        
      // Find patient name for notification
      const patient = patients.find(p => p.id === values.patientId);
      
      // Create notifications for doctor and patient
      await createBookingNotifications(
        data,
        doctorId,
        values.patientId,
        startDateTime,
        values.reminder,
        patient?.name
      );
      
      // Show success toast
      toast({
        title: "Appointment Scheduled",
        description: `Teleconsultation has been scheduled and notifications sent.`,
      });
      
      // Call callbacks
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

// Re-export types and constants from the types file
export * from "./types/bookingTypes";
