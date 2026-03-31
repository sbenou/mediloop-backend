
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Clock, CircleAlert } from "lucide-react";
import { useBookingDialog } from "./hooks/useBookingDialog";
import BookingDetailsForm from "./BookingDetailsForm";
import BookingTimeForm from "./BookingTimeForm";
import { AppointmentType } from "@/types/domain";

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

const TeleconsultationBookingDialog = (props: TeleconsultationBookingDialogProps) => {
  const {
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
  } = useBookingDialog(props);

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onClose}>
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
            
            <TabsContent value="details">
              <BookingDetailsForm
                title={title}
                setTitle={setTitle}
                patients={props.patients || []}
                patientId={patientId}
                setPatientId={setPatientId}
                reason={reason}
                setReason={setReason}
                duration={duration}
                setDuration={setDuration}
                appointmentType={props.appointmentType || 'teleconsultation'}
              />
            </TabsContent>
            
            <TabsContent value="time">
              <BookingTimeForm
                date={date}
                setDate={setDate}
                time={time}
                setTime={setTime}
                reminder={reminder}
                setReminder={setReminder}
              />
            </TabsContent>
          </Tabs>
          
          {/* Notes */}
          <div className="flex items-start text-sm text-muted-foreground">
            <CircleAlert className="h-4 w-4 mr-2 mt-0.5" />
            <p>
              {props.appointmentType === 'teleconsultation' 
                ? 'A video conference link will be provided once the teleconsultation is confirmed.'
                : 'Please arrive 15 minutes before your scheduled appointment time.'}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={props.onClose}>
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
