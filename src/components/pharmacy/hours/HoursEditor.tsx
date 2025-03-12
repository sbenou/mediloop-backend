
import React from "react";
import { WeekHours } from "@/types/pharmacy/hours";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface HoursEditorProps {
  weekHours: WeekHours;
  onHoursChange: (weekHours: WeekHours) => void;
  onCancel: () => void;
  onSave: () => void;
}

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
              <Input
                type="time"
                value={dayData.openTime}
                onChange={(e) => handleTimeChange(day as keyof WeekHours, 'openTime', e.target.value)}
                className="w-24"
              />
              <span>-</span>
              <Input
                type="time"
                value={dayData.closeTime}
                onChange={(e) => handleTimeChange(day as keyof WeekHours, 'closeTime', e.target.value)}
                className="w-24"
              />
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
