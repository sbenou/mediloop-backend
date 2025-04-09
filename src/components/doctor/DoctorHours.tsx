import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { WeekHours, defaultHours } from '@/types/pharmacy/hours';
import { parseStringHours, formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';
import { HoursEditor } from '@/components/pharmacy/hours/HoursEditor';

interface DoctorHoursProps {
  hours: string | null;
  doctorId: string;
  isEditing?: boolean;
  setIsEditing?: Dispatch<SetStateAction<boolean>>;
}

const DoctorHours: React.FC<DoctorHoursProps> = ({ 
  hours, 
  doctorId, 
  isEditing = false,
  setIsEditing
}) => {
  const [hoursText, setHoursText] = useState(hours || '');
  const [weekHours, setWeekHours] = useState<WeekHours | null>(null);
  const [formattedHours, setFormattedHours] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isStructuredFormat, setIsStructuredFormat] = useState(false);
  
  // Parse hours on initial load
  useEffect(() => {
    if (hours) {
      try {
        // Try to parse as JSON first
        if (hours.trim().startsWith('{')) {
          const parsedHours = JSON.parse(hours);
          setWeekHours(parsedHours);
          setIsStructuredFormat(true);
          setFormattedHours(formatHoursDisplay(parsedHours));
        } else {
          // If it's string format, parse it to structured format
          setHoursText(hours);
          const parsedHours = parseStringHours(hours);
          setWeekHours(parsedHours);
          setFormattedHours(formatHoursDisplay(parsedHours));
          setIsStructuredFormat(false);
        }
      } catch (error) {
        console.error('Error parsing hours:', error);
        setHoursText(hours);
        const parsedHours = parseStringHours(hours || '');
        setWeekHours(parsedHours);
        setFormattedHours(formatHoursDisplay(parsedHours));
        setIsStructuredFormat(false);
      }
    } else {
      // Initialize with default hours if none exist
      setWeekHours(defaultHours);
      setFormattedHours(formatHoursDisplay(defaultHours));
      setIsStructuredFormat(true);
    }
  }, [hours]);

  const handleSaveText = async () => {
    if (!doctorId) return;
    
    try {
      setIsSaving(true);
      
      // Save as text format
      const { error } = await supabase
        .from('doctor_metadata')
        .upsert({ 
          doctor_id: doctorId,
          hours: hoursText,
          updated_at: new Date().toISOString()
        }, { onConflict: 'doctor_id' });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Opening hours updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
      
      // Update parsed display
      const parsedHours = parseStringHours(hoursText);
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
  
  const handleSaveStructured = async () => {
    if (!doctorId || !weekHours) return;
    
    try {
      setIsSaving(true);
      
      // Save as JSON format
      const hoursData = JSON.stringify(weekHours);
      
      const { error } = await supabase
        .from('doctor_metadata')
        .upsert({ 
          doctor_id: doctorId,
          hours: hoursData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'doctor_id' });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Opening hours updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
      setIsStructuredFormat(true);
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

  // Textarea editor for string format
  const TextEditor = () => (
    <div className="space-y-4">
      <Textarea
        value={hoursText}
        onChange={(e) => setHoursText(e.target.value)}
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
          variant="default"
          size="sm" 
          onClick={handleSaveText}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );

  // If in editing mode, show the appropriate editor
  if (isEditing) {
    if (weekHours) {
      return (
        <HoursEditor
          weekHours={weekHours}
          onHoursChange={setWeekHours}
          onCancel={() => setIsEditing && setIsEditing(false)}
          onSave={handleSaveStructured}
        />
      );
    }
    return <TextEditor />;
  }

  // Display hours in structured format
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
            <div key={index} className="text-sm flex">
              <span className="font-medium w-24">{line.split(':')[0]}:</span>
              <span>{line.split(':').slice(1).join(':').trim()}</span>
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
    <div className="space-y-4">
      {displayFormattedHours()}
    </div>
  );
};

export default DoctorHours;
