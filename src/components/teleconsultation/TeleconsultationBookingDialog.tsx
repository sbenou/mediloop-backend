
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
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

type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Define reminder options
const REMINDER_OPTIONS = [
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
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

interface TeleconsultationBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  doctorLocation?: string;
  patients: Array<{ id: string; name: string }>;
  onBookingCreated: () => void;
}

const TeleconsultationBookingDialog: React.FC<TeleconsultationBookingDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  doctorId,
  doctorLocation = "Doctor's office",
  patients,
  onBookingCreated
}) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Teleconsultation</DialogTitle>
          <DialogDescription>
            Book a teleconsultation appointment for a patient.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Patient Selection */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      <Input type="date" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Time Slot */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Reminder */}
            <FormField
              control={form.control}
              name="reminder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Set reminder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REMINDER_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description with Jitsi Link */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeleconsultationBookingDialog;
