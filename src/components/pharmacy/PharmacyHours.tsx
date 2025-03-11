import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit, Save, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DayHours {
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface WeekHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface PharmacyHoursProps {
  hours: string | null;
  pharmacyId: string;
}

const defaultHours: WeekHours = {
  monday: { open: true, openTime: '09:00', closeTime: '18:00' },
  tuesday: { open: true, openTime: '09:00', closeTime: '18:00' },
  wednesday: { open: true, openTime: '09:00', closeTime: '18:00' },
  thursday: { open: true, openTime: '09:00', closeTime: '18:00' },
  friday: { open: true, openTime: '09:00', closeTime: '18:00' },
  saturday: { open: true, openTime: '09:00', closeTime: '13:00' },
  sunday: { open: false, openTime: '09:00', closeTime: '18:00' },
};

const PharmacyHours: React.FC<PharmacyHoursProps> = ({ hours, pharmacyId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [weekHours, setWeekHours] = useState<WeekHours>(defaultHours);

  useEffect(() => {
    if (hours) {
      try {
        // Try to parse the hours as JSON
        const parsedHours = JSON.parse(hours);
        setWeekHours(parsedHours);
      } catch (error) {
        console.error('Error parsing hours:', error);
        
        // If the hours are in string format (like "Mon-Fri: 8:00-19:00"), don't try to use them
        // Just keep the default hours instead
        console.log('Using default hours since the format could not be parsed as JSON');
      }
    }
  }, [hours]);

  const handleToggleDay = (day: keyof WeekHours) => {
    setWeekHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        open: !prev[day].open,
      }
    }));
  };

  const handleTimeChange = (day: keyof WeekHours, field: 'openTime' | 'closeTime', value: string) => {
    setWeekHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      }
    }));
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({
          hours: JSON.stringify(weekHours),
        })
        .eq('id', pharmacyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opening hours updated successfully",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update opening hours",
      });
    }
  };

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Display the formatted hours string if we couldn't parse the JSON
  const displayStringHours = () => {
    if (hours && !isEditing) {
      try {
        // Try to parse as JSON
        JSON.parse(hours);
        // If successful, return null as we'll use the weekHours state
        return null;
      } catch (error) {
        // If the JSON parse failed, it's a plain string, so display it
        return (
          <div className="space-y-1 text-sm">
            {hours.split(',').map((line, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{line.trim()}</span>
              </div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  if (isEditing) {
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
          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Hours
          </Button>
        </div>
      </div>
    );
  }

  // If hours is a plain string format, display it that way
  const stringHoursDisplay = displayStringHours();
  if (stringHoursDisplay) {
    return (
      <div className="space-y-3">
        {stringHoursDisplay}
        <div className="flex justify-end mt-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Hours
          </Button>
        </div>
      </div>
    );
  }

  // Otherwise show the structured hours format
  return (
    <div className="space-y-3">
      {Object.entries(weekHours).map(([day, dayData]) => (
        <div key={day} className="flex justify-between items-center">
          <span className="font-medium">{formatDay(day)}</span>
          {dayData.open ? (
            <span className="text-sm">{dayData.openTime} - {dayData.closeTime}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Closed</span>
          )}
        </div>
      ))}
      <div className="flex justify-end mt-2">
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Hours
        </Button>
      </div>
    </div>
  );
};

export default PharmacyHours;
