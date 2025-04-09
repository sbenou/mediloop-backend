
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { WeekHours, DayHours, defaultHours } from '@/types/pharmacy/hours';
import { parseStringHours, validateHoursData, formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';

interface PharmacyHoursProps {
  hours: string | null;
  pharmacyId: string;
  isEditing?: boolean;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
}

const PharmacyHours: React.FC<PharmacyHoursProps> = ({ 
  hours, 
  pharmacyId, 
  isEditing = false,
  setIsEditing
}) => {
  const [weekHours, setWeekHours] = useState<WeekHours | null>(null);
  const [isJsonFormat, setIsJsonFormat] = useState(false);
  const [hoursString, setHoursString] = useState<string | null>(null);
  const [formattedHours, setFormattedHours] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hours) {
      try {
        // Only try to parse if the hours string starts with a JSON-like character
        if (hours.trim().startsWith('{')) {
          // Try to parse the hours as JSON
          const parsedHours = JSON.parse(hours);
          // Validate and fill any missing properties
          const validatedHours = validateHoursData(parsedHours);
          setWeekHours(validatedHours);
          setIsJsonFormat(true);
          setFormattedHours(formatHoursDisplay(validatedHours));
        } else {
          // If the hours are in string format, store them as a string
          console.log('Hours are in string format, not attempting to parse as JSON');
          setHoursString(hours);
          // Also try to parse into structured format
          const parsedHours = parseStringHours(hours);
          setWeekHours(parsedHours);
          setFormattedHours(formatHoursDisplay(parsedHours));
          setIsJsonFormat(false);
        }
      } catch (error) {
        console.error('Error parsing hours:', error);
        
        // If the hours are in string format, still store them as a string
        console.log('Using default hours since the format could not be parsed as JSON');
        setHoursString(hours);
        // Try to parse from string format into structured format
        const parsedHours = parseStringHours(hours || '');
        setWeekHours(parsedHours);
        setFormattedHours(formatHoursDisplay(parsedHours));
        setIsJsonFormat(false);
      }
    } else {
      // Initialize with default hours if none exist
      setWeekHours(defaultHours);
      setFormattedHours(formatHoursDisplay(defaultHours));
      setIsJsonFormat(true);
    }
  }, [hours]);

  const handleSaveJsonHours = async () => {
    try {
      if (!weekHours) return;
      setIsSaving(true);
      
      // Convert to JSON format when saving
      const hoursData = JSON.stringify(weekHours);
      
      const { error } = await supabase
        .from('pharmacies')
        .update({
          hours: hoursData,
        })
        .eq('id', pharmacyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opening hours updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
      setIsJsonFormat(true);
      setHoursString(null);
      setFormattedHours(formatHoursDisplay(weekHours));
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update opening hours",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStringHours = async () => {
    try {
      if (!hoursString) return;
      setIsSaving(true);
      
      const { error } = await supabase
        .from('pharmacies')
        .update({
          hours: hoursString,
        })
        .eq('id', pharmacyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Opening hours updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
      
      // Update the parsed hours from the string
      const parsedHours = parseStringHours(hoursString);
      setWeekHours(parsedHours);
      setFormattedHours(formatHoursDisplay(parsedHours));
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update opening hours",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDayChange = (day: keyof WeekHours, field: keyof DayHours, value: any) => {
    if (!weekHours) return;
    
    setWeekHours(prev => {
      if (!prev) return prev;
      
      const updatedHours = { ...prev };
      updatedHours[day] = {
        ...updatedHours[day],
        [field]: value
      };
      
      return updatedHours;
    });
  };
  
  // Textarea editor for string format
  const StringEditor = () => (
    <div className="space-y-4">
      <Textarea
        value={hoursString || ''}
        onChange={(e) => setHoursString(e.target.value)}
        placeholder="Monday to Friday: 9:00 - 17:00&#10;Saturday: 10:00 - 13:00&#10;Sunday: Closed"
        rows={5}
      />
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsEditing && setIsEditing(false)}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={handleSaveStringHours}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
  
  // Structured day-by-day editor
  const StructuredEditor = () => {
    if (!weekHours) return null;
    
    const days: Array<[keyof WeekHours, string]> = [
      ['monday', 'Monday'],
      ['tuesday', 'Tuesday'],
      ['wednesday', 'Wednesday'],
      ['thursday', 'Thursday'],
      ['friday', 'Friday'],
      ['saturday', 'Saturday'],
      ['sunday', 'Sunday']
    ];
    
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {days.map(([dayKey, dayLabel]) => (
            <div key={dayKey} className="grid grid-cols-[1fr_2fr_2fr_auto] gap-2 items-center">
              <div className="font-medium">{dayLabel}</div>
              <div className="flex items-center space-x-2">
                <Input
                  type="time"
                  value={weekHours[dayKey].openTime}
                  onChange={(e) => handleDayChange(dayKey, 'openTime', e.target.value)}
                  disabled={!weekHours[dayKey].open}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="time"
                  value={weekHours[dayKey].closeTime}
                  onChange={(e) => handleDayChange(dayKey, 'closeTime', e.target.value)}
                  disabled={!weekHours[dayKey].open}
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-end space-x-2">
                <Switch 
                  id={`${dayKey}-open`} 
                  checked={weekHours[dayKey].open}
                  onCheckedChange={(checked) => handleDayChange(dayKey, 'open', checked)}
                />
                <Label htmlFor={`${dayKey}-open`} className="text-sm">
                  {weekHours[dayKey].open ? "Open" : "Closed"}
                </Label>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsEditing && setIsEditing(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSaveJsonHours}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  };
  
  if (isEditing) {
    if (weekHours) {
      return <StructuredEditor />;
    } else if (!isJsonFormat && hoursString !== null) {
      return <StringEditor />;
    } else {
      return <StringEditor />;
    }
  }
  
  // Display formatted hours
  const displayFormattedHours = () => {
    if (formattedHours.length === 0 && (!hours || hours.trim() === '')) {
      return (
        <div className="text-muted-foreground italic">
          No opening hours set. Click edit to add opening hours.
        </div>
      );
    }
    
    if (formattedHours.length > 0) {
      return (
        <div className="space-y-1">
          {formattedHours.map((line, index) => (
            <div key={index} className="text-sm flex justify-between">
              {line}
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback to showing the raw text
    const hoursLines = hours ? hours.split(/\r?\n/) : [];
    return (
      <div className="space-y-2">
        {hoursLines.map((line, index) => (
          <div key={index} className="text-sm">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {displayFormattedHours()}
    </div>
  );
};

export default PharmacyHours;
