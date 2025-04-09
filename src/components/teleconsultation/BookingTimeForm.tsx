
import React from "react";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIME_OPTIONS, REMINDER_OPTIONS } from "./hooks/useBookingDialog";

interface BookingTimeFormProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  time: string | undefined;
  setTime: (time: string) => void;
  reminder: string;
  setReminder: (reminder: string) => void;
}

const BookingTimeForm = ({
  date,
  setDate,
  time,
  setTime,
  reminder,
  setReminder
}: BookingTimeFormProps) => {
  return (
    <div className="space-y-4 pt-4">
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

      {/* Reminder Selection */}
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
    </div>
  );
};

export default BookingTimeForm;
