
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addHours, setHours, setMinutes, parse } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/auth/useAuth';

interface TeleconsultationBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  patients?: Array<{ id: string; name: string }>;
  onBookingCreated?: () => void;
  appointmentType?: 'teleconsultation' | 'in-person';
}

const bookingSchema = z.object({
  patientId: z.string().nonempty('Please select a patient'),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (e.g. 14:30)'),
  duration: z.number().min(15, 'Minimum duration is 15 minutes').max(120, 'Maximum duration is 120 minutes'),
  reason: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

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
  const { profile } = useAuth();
  const isDoctor = profile?.role === 'doctor';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(patients.length > 0 ? 'existing' : 'new');

  const defaultDate = selectedDate || new Date();
  const defaultTime = selectedTime || '09:00';
  const defaultDuration = 30;

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      patientId: patients.length > 0 ? patients[0].id : '',
      date: defaultDate,
      time: defaultTime,
      duration: defaultDuration,
      reason: '',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);

      // Create start and end times from the form data
      const dateStr = format(data.date, 'yyyy-MM-dd');
      const [hours, minutes] = data.time.split(':').map(Number);
      const startTime = new Date(`${dateStr}T${data.time}`);
      const endTime = addHours(startTime, data.duration / 60);

      const appointmentMeta: Record<string, any> = {};
      
      // Set the appointment type metadata
      if (appointmentType === 'teleconsultation') {
        appointmentMeta.is_teleconsultation = true;
        appointmentMeta.appointment_type = 'teleconsultation';
      } else {
        appointmentMeta.is_in_person = true;
        appointmentMeta.appointment_type = 'in-person';
      }

      // Create the teleconsultation
      const { data: newConsultation, error } = await supabase
        .from('teleconsultations')
        .insert({
          doctor_id: doctorId,
          patient_id: data.patientId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'confirmed',
          reason: data.reason || `${appointmentType === 'teleconsultation' ? 'Teleconsultation' : 'In-person appointment'} at ${format(startTime, 'p')}`,
          meta: appointmentMeta
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: `${appointmentType === 'teleconsultation' ? 'Teleconsultation' : 'Appointment'} scheduled`,
        description: `The ${appointmentType === 'teleconsultation' ? 'teleconsultation' : 'appointment'} has been successfully scheduled.`,
      });

      if (onBookingCreated) {
        onBookingCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating teleconsultation:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to schedule',
        description: 'There was an error creating the appointment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = form.watch('date') ? format(form.watch('date'), 'EEEE, MMMM d, yyyy') : '';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {appointmentType === 'teleconsultation' ? 'Schedule Teleconsultation' : 'Schedule In-Person Appointment'}
          </DialogTitle>
          <DialogDescription>
            {appointmentType === 'teleconsultation' 
              ? 'Book a virtual consultation with your patient' 
              : 'Book an in-person appointment at your clinic'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isDoctor && patients.length > 0 && (
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="existing">Existing Patient</TabsTrigger>
                  <TabsTrigger value="new">New Patient</TabsTrigger>
                </TabsList>

                <TabsContent value="existing">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Select Patient</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
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
                </TabsContent>

                <TabsContent value="new">
                  <div className="space-y-2">
                    <Label>New patient functionality coming soon</Label>
                    <p className="text-sm text-muted-foreground">
                      You can only book with existing connected patients for now.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={format(field.value, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : new Date();
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={appointmentType === 'teleconsultation' 
                        ? "Brief description of the teleconsultation" 
                        : "Brief description of the in-person visit"}
                      className="resize-none"
                      disabled={isSubmitting}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">{formattedDate}</div>
              <div className="text-sm text-muted-foreground">
                {form.watch('time') && form.watch('duration') && (
                  <>
                    {form.watch('time')} - {getEndTimeString(form.watch('time'), form.watch('duration'))}
                    {' '}({form.watch('duration')} minutes)
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule {appointmentType === 'teleconsultation' ? 'Teleconsultation' : 'Appointment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

function getEndTimeString(timeString: string, durationMinutes: number): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  
  const endTime = new Date(date.getTime() + durationMinutes * 60000);
  return format(endTime, 'HH:mm');
}

export default TeleconsultationBookingDialog;
