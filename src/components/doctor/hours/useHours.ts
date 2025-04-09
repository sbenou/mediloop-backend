
import { useState, useEffect } from 'react';
import { WeekHours, defaultHours } from '@/types/pharmacy/hours';
import { parseStringHours, formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

export const useHours = (hours: string | null, doctorId: string, setIsEditing?: (value: boolean) => void) => {
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

  return {
    hoursText,
    setHoursText,
    weekHours,
    setWeekHours,
    formattedHours,
    isSaving,
    isStructuredFormat,
    handleSaveText,
    handleSaveStructured
  };
};
