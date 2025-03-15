
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { BookingFormValues } from "../hooks/useBookingForm";

interface PatientSelectorProps {
  form: UseFormReturn<BookingFormValues>;
  patients: Array<{ id: string; name: string }>;
}

const PatientSelector: React.FC<PatientSelectorProps> = ({ form, patients }) => {
  return (
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
  );
};

export default PatientSelector;
