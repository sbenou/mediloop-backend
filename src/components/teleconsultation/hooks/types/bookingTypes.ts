
import { z } from "zod";

// Define validation schema for form
export const bookingFormSchema = z.object({
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

export interface UseBookingFormProps {
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  doctorLocation?: string;
  patients: Array<{ id: string; name: string }>;
  onBookingCreated: () => void;
  onClose: () => void;
}
