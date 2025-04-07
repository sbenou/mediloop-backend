
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { WeekHours } from '@/types/pharmacy/hours';
import { parseStringHours, validateHoursData, formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';
import { HoursEditor } from './hours/HoursEditor';
import { StringHoursEditor } from './hours/StringHoursEditor';
import { HoursDisplay } from './hours/HoursDisplay';

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
    }
  }, [hours]);

  const handleSaveJsonHours = async () => {
    try {
      if (!weekHours) return;
      
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
    }
  };

  const handleSaveStringHours = async () => {
    try {
      if (!hoursString) return;
      
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
    }
  };
  
  if (isEditing) {
    if (!isJsonFormat && hoursString !== null) {
      return (
        <StringHoursEditor
          hoursString={hoursString}
          onHoursChange={setHoursString}
          onCancel={() => setIsEditing && setIsEditing(false)}
          onSave={handleSaveStringHours}
        />
      );
    } else if (weekHours) {
      return (
        <HoursEditor
          weekHours={weekHours}
          onHoursChange={setWeekHours}
          onCancel={() => setIsEditing && setIsEditing(false)}
          onSave={handleSaveJsonHours}
        />
      );
    }
  }
  
  return (
    <div className="space-y-3">
      <HoursDisplay formattedHours={formattedHours} />
    </div>
  );
};

export default PharmacyHours;
