import React from "react";
import { useBookingForm, TIME_OPTIONS, REMINDER_OPTIONS } from "./hooks";

interface TeleconsultationSchedulerProps {
  selectedDate?: Date;
  selectedTime?: string;
  doctorId: string;
  doctorLocation?: string;
  patients: Array<{ id: string; name: string }>;
  onBookingCreated: () => void;
  onClose: () => void;
}

const TeleconsultationScheduler = ({
  selectedDate,
  selectedTime,
  doctorId,
  doctorLocation,
  patients,
  onBookingCreated,
  onClose
}: TeleconsultationSchedulerProps) => {
  const { form, isSubmitting, handleSubmit, roomId } = useBookingForm({
    selectedDate,
    selectedTime,
    doctorId,
    doctorLocation,
    patients,
    onBookingCreated,
    onClose
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title/Subject Field */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title / Subject</label>
        <input
          id="title"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter appointment title"
          required
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>
      
      {/* Patient Selection */}
      <div className="space-y-2">
        <label htmlFor="patientId" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Patient</label>
        <select
          id="patientId"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("patientId")}
        >
          <option value="">Select a patient</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
        {form.formState.errors.patientId && (
          <p className="text-sm text-red-500">{form.formState.errors.patientId.message}</p>
        )}
      </div>
      
      {/* Date Selection */}
      <div className="space-y-2">
        <label htmlFor="date" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Date</label>
        <input
          type="date"
          id="date"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("date")}
        />
        {form.formState.errors.date && (
          <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
        )}
      </div>
      
      {/* Time Selection */}
      <div className="space-y-2">
        <label htmlFor="startTime" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Time</label>
        <select
          id="startTime"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("startTime")}
        >
          <option value="">Select a time</option>
          {TIME_OPTIONS.map(timeOption => (
            <option key={timeOption} value={timeOption}>
              {timeOption}
            </option>
          ))}
        </select>
        {form.formState.errors.startTime && (
          <p className="text-sm text-red-500">{form.formState.errors.startTime.message}</p>
        )}
      </div>
      
      {/* Duration */}
      <div className="space-y-2">
        <label htmlFor="endTime" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Duration</label>
        <select
          id="endTime"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("endTime")}
        >
          <option value="">Select duration</option>
          <option value="10:00">1 hour</option>
          <option value="10:30">1 hour 30 minutes</option>
          <option value="11:00">2 hours</option>
        </select>
        {form.formState.errors.endTime && (
          <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
        )}
      </div>

      {/* Reminder Selection */}
      <div className="space-y-2">
        <label htmlFor="reminder" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Set Reminder</label>
        <select
          id="reminder"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...form.register("reminder")}
        >
          {REMINDER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {form.formState.errors.reminder && (
          <p className="text-sm text-red-500">{form.formState.errors.reminder.message}</p>
        )}
      </div>

      {/* Location Field */}
      <div className="space-y-2">
        <label htmlFor="location" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
        <input
          id="location"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter location"
          {...form.register("location")}
          defaultValue={doctorLocation}
        />
        {form.formState.errors.location && (
          <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
        )}
      </div>
      
      {/* Description Field */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
        <textarea
          id="description"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter description"
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
        )}
      </div>
      
      {/* Display Room ID */}
      <div>
        <p className="text-sm text-muted-foreground">
          Room ID: {roomId}
        </p>
      </div>

      {/* Submit Button */}
      <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};

export default TeleconsultationScheduler;
