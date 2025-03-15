
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { BookingFormValues, REMINDER_OPTIONS } from "../hooks/useBookingForm";

interface ReminderAndLocationProps {
  form: UseFormReturn<BookingFormValues>;
}

const ReminderAndLocation: React.FC<ReminderAndLocationProps> = ({ form }) => {
  return (
    <>
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
    </>
  );
};

export default ReminderAndLocation;
