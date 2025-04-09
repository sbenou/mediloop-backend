
import React from "react";
import { WeekHours } from "@/types/pharmacy/hours";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface HoursEditorProps {
  weekHours: WeekHours;
  onHoursChange: (weekHours: WeekHours) => void;
  onCancel: () => void;
  onSave: () => void;
}

// Generate 24-hour format time options in 15 min increments
const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export const HoursEditor: React.FC<HoursEditorProps> = ({
  weekHours,
  onHoursChange,
  onCancel,
  onSave,
}) => {
  const handleToggleDay = (day: keyof WeekHours) => {
    onHoursChange({
      ...weekHours,
      [day]: {
        ...weekHours[day],
        open: !weekHours[day].open,
      }
    });
  };

  const handleTimeChange = (day: keyof WeekHours, field: 'openTime' | 'closeTime', value: string) => {
    onHoursChange({
      ...weekHours,
      [day]: {
        ...weekHours[day],
        [field]: value,
      }
    });
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Column Headers */}
      <div className="grid grid-cols-4 gap-4 mb-2 px-4">
        <div className="font-medium">Day</div>
        <div className="font-medium text-right">Start Time</div>
        <div className="font-medium text-right">End Time</div>
        <div className="font-medium text-center">Open/Closed</div>
      </div>

      {Object.entries(weekHours).map(([day, dayData]) => (
        <div key={day} className="grid grid-cols-4 items-center gap-4">
          <div className="font-medium pl-4">
            {formatDay(day)}
          </div>
          
          <div className="text-right">
            <Select
              value={dayData.openTime}
              onValueChange={(value) => handleTimeChange(day as keyof WeekHours, 'openTime', value)}
              disabled={!dayData.open}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={`${day}-open-${time}`} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-right">
            <Select
              value={dayData.closeTime}
              onValueChange={(value) => handleTimeChange(day as keyof WeekHours, 'closeTime', value)}
              disabled={!dayData.open}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((time) => (
                  <SelectItem key={`${day}-close-${time}`} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-center items-center">
            <Switch 
              checked={dayData.open} 
              onCheckedChange={() => handleToggleDay(day as keyof WeekHours)} 
              id={`switch-${day}`}
            />
          </div>
        </div>
      ))}
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Hours
        </Button>
      </div>
    </div>
  );
};
