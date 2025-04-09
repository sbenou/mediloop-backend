
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
      {Object.entries(weekHours).map(([day, dayData]) => (
        <div key={day} className="flex items-center space-x-4">
          <div className="w-24">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={dayData.open} 
                onCheckedChange={() => handleToggleDay(day as keyof WeekHours)} 
                id={`switch-${day}`}
              />
              <Label htmlFor={`switch-${day}`}>{formatDay(day)}</Label>
            </div>
          </div>
          
          {dayData.open ? (
            <div className="flex items-center space-x-2">
              <Select
                value={dayData.openTime}
                onValueChange={(value) => handleTimeChange(day as keyof WeekHours, 'openTime', value)}
              >
                <SelectTrigger className="w-24">
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
              <span>-</span>
              <Select
                value={dayData.closeTime}
                onValueChange={(value) => handleTimeChange(day as keyof WeekHours, 'closeTime', value)}
              >
                <SelectTrigger className="w-24">
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
          ) : (
            <span className="text-sm text-muted-foreground">Closed</span>
          )}
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
