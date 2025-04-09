
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, setMinutes, setHours, addHours, parseISO } from "date-fns";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar as CalendarIcon, User, Clock, CircleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppointmentType } from "@/types/supabase";

// Define props for the component
interface TeleconsultationBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  patients?: Array<{ id: string, name: string, email?: string }>;
  onBookingCreated?: () => void;
  appointmentType?: 'teleconsultation' | 'in-person';
}

// Create a schema for form validation
const bookingSchema = z.object({
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

// Generate available time options in 15-minute intervals from 8 AM to 8 PM
const generateTimeOptions = () => {
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

const TIME_OPTIONS = generateTimeOptions();

const TeleconsultationBookingDialog = ({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  doctorId,
  patients = [],
  onBookingCreated,
  appointmentType = 'teleconsultation'
}: TeleconsultationBookingDialogProps) => {
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
  
  // Handle form submission
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
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getAppointmentTypeTitle = () => {
    return appointmentType === 'teleconsultation' 
      ? 'Schedule Teleconsultation'
      : 'Schedule In-Person Appointment';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{getAppointmentTypeTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Details</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="time">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Date & Time</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
              {/* Title/Subject Field - New addition */}
              <div className="space-y-2">
                <Label htmlFor="title">Title / Subject</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter appointment title"
                  required
                />
              </div>
              
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select 
                  value={patientId} 
                  onValueChange={setPatientId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Reason for Visit */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for {appointmentType === 'teleconsultation' ? 'Teleconsultation' : 'Visit'}</Label>
                <Textarea
                  id="reason"
                  placeholder={`Please provide details about the reason for this ${appointmentType}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
              
              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select 
                  value={duration.toString()} 
                  onValueChange={(value) => setDuration(parseInt(value, 10))}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            
            <TabsContent value="time" className="space-y-4 pt-4">
              {/* Date Selection */}
              <div className="space-y-2">
                <Label className="block">Date</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </div>
              
              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Select 
                  value={time} 
                  onValueChange={setTime}
                >
                  <SelectTrigger id="time">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(timeOption => (
                      <SelectItem key={timeOption} value={timeOption}>
                        {timeOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reminder Selection - New addition */}
              <div className="space-y-2">
                <Label htmlFor="reminder">Set Reminder</Label>
                <Select
                  value={reminder}
                  onValueChange={setReminder}
                >
                  <SelectTrigger id="reminder">
                    <SelectValue placeholder="Select reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Notes */}
          <div className="flex items-start text-sm text-muted-foreground">
            <CircleAlert className="h-4 w-4 mr-2 mt-0.5" />
            <p>
              {appointmentType === 'teleconsultation' 
                ? 'A video conference link will be provided once the teleconsultation is confirmed.'
                : 'Please arrive 15 minutes before your scheduled appointment time.'}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeleconsultationBookingDialog;
