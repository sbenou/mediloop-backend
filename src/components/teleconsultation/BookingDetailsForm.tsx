
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BookingDetailsFormProps {
  title: string;
  setTitle: (value: string) => void;
  patients: Array<{ id: string, name: string, email?: string }>;
  patientId: string;
  setPatientId: (value: string) => void;
  reason: string;
  setReason: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  appointmentType: 'teleconsultation' | 'in-person';
}

const BookingDetailsForm = ({
  title,
  setTitle,
  patients,
  patientId,
  setPatientId,
  reason,
  setReason,
  duration,
  setDuration,
  appointmentType
}: BookingDetailsFormProps) => {
  return (
    <div className="space-y-4 pt-4">
      {/* Title/Subject Field */}
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
    </div>
  );
};

export default BookingDetailsForm;
