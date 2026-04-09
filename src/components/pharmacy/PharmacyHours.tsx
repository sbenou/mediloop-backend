
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { updatePharmacyWorkspaceApi } from '@/services/professionalWorkspaceApi';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WeekHours, defaultHours } from '@/types/pharmacy/hours';
import { parseStringHours, validateHoursData, formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';
import { HoursEditor } from '@/components/pharmacy/hours/HoursEditor';

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
  setIsEditing,
  onSaved,
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
      
      await updatePharmacyWorkspaceApi({ hours: hoursString });

      toast({
        title: "Success",
        description: "Opening hours updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
      onSaved?.();
      
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
  
  if (isEditing) {
    if (weekHours) {
      return (
        <HoursEditor
          weekHours={weekHours}
          onHoursChange={setWeekHours}
          onCancel={() => setIsEditing && setIsEditing(false)}
          onSave={handleSaveJsonHours}
        />
      );
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
