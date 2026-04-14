import { format } from "date-fns";
import { createTeleconsultationApi } from "@/services/clinicalApi";
import { BookingFormValues } from "../types/bookingTypes";
import { createNotification } from "@/utils/notifications";

// Generate a unique room ID for the teleconsultation
export const generateRoomId = (): string => {
  return `consultation-${crypto.randomUUID().substring(0, 8)}`;
};

// Create a default description template with Jitsi link
export const generateDefaultDescription = (roomId: string): string => {
  return `This is a teleconsultation appointment. Please join the call using the following link:\n\nhttps://meet.jit.si/${roomId}\n\nJoin a few minutes before the appointment time. If you have any issues, please contact the office.`;
};

// Format dates for booking
export const formatBookingDates = (date: string, startTime: string, endTime: string) => {
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${date}T${endTime}`);
  
  return {
    startDateTime,
    endDateTime
  };
};

// Create teleconsultation in the database
export const createTeleconsultation = async (
  values: BookingFormValues,
  _doctorId: string,
  roomId: string,
  _patients: Array<{ id: string; name: string }>,
) => {
  void _doctorId;
  void _patients;
  const { startDateTime, endDateTime } = formatBookingDates(
    values.date,
    values.startTime,
    values.endTime,
  );

  return await createTeleconsultationApi({
    patient_id: values.patientId,
    start_time: startDateTime.toISOString(),
    end_time: endDateTime.toISOString(),
    status: "confirmed",
    reason: values.title,
    room_id: roomId,
  });
};

// Create notifications for doctor and patient
export const createBookingNotifications = async (
  consultationData: any,
  doctorId: string,
  patientId: string,
  startDateTime: Date,
  reminder: string,
  patientName: string | undefined
) => {
  // Create notification for the doctor
  await createNotification({
    userId: doctorId,
    type: "new_teleconsultation",
    title: "New Teleconsultation Booked",
    message: `You have scheduled a teleconsultation with ${patientName} on ${format(startDateTime, 'MMMM d, yyyy')} at ${format(startDateTime, 'h:mm a')}`,
    link: `/dashboard?view=teleconsultations`,
    meta: {
      consultationId: consultationData.id,
      reminder: reminder
    }
  });
  
  // Create notification for the patient
  await createNotification({
    userId: patientId,
    type: "new_teleconsultation",
    title: "New Teleconsultation Scheduled",
    message: `A doctor has scheduled a teleconsultation for you on ${format(startDateTime, 'MMMM d, yyyy')} at ${format(startDateTime, 'h:mm a')}`,
    link: `/dashboard?view=teleconsultations`,
    meta: {
      consultationId: consultationData.id,
      reminder: reminder
    }
  });
};
