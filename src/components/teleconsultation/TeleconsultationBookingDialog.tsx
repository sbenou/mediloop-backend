
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import PatientSelector from "./booking/PatientSelector";
import AppointmentDetails from "./booking/AppointmentDetails";
import AppointmentDateTime from "./booking/AppointmentDateTime";
import ReminderAndLocation from "./booking/ReminderAndLocation";
import { useBookingForm } from "./hooks/useBookingForm";

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
  const { form, isSubmitting, handleSubmit } = useBookingForm({
    selectedDate,
    selectedTime,
    doctorId,
    doctorLocation,
    patients,
    onBookingCreated,
    onClose
  });

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
            <PatientSelector form={form} patients={patients} />
            <AppointmentDetails form={form} />
            <AppointmentDateTime form={form} />
            <ReminderAndLocation form={form} />
            
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
