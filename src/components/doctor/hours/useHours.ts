
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { parseHoursText, stringifyWeekHours, formatHoursDisplay } from '@/utils/pharmacy/hoursFormatters';
import { WeekHours } from '@/types/pharmacy/hours';
import { toast } from '@/components/ui/use-toast';

export const useHours = (
  initialHours: string | null,
  doctorId: string,
  setIsEditing?: Dispatch<SetStateAction<boolean>>
) => {
  const [hoursText, setHoursText] = useState(initialHours || '');
  const [weekHours, setWeekHours] = useState<WeekHours | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Parse initial hours and determine format
  useEffect(() => {
    if (initialHours) {
      setHoursText(initialHours);
      try {
        const parsed = parseHoursText(initialHours);
        if (parsed) {
          setWeekHours(parsed);
        }
      } catch (error) {
        // If parsing fails, it's probably free text format
        console.log('Hours are in free text format');
      }
    }
  }, [initialHours]);

  // Format hours for display
  const formattedHours = formatHoursDisplay(hoursText);
  
  // Check if hours are in structured format
  const isStructuredFormat = weekHours !== null;

  const handleSaveText = async () => {
    setIsSaving(true);
    try {
      // Update doctor_metadata table
      const { error } = await supabase
        .from('doctor_metadata')
        .upsert({
          doctor_id: doctorId,
          hours: hoursText,
          address: '', // Keep existing or set empty if new
          city: '',
          postal_code: ''
        });

      if (error) throw error;

      toast({
        title: "Hours updated",
        description: "Doctor hours have been saved successfully.",
      });
      
      if (setIsEditing) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving hours:', error);
      toast({
        title: "Error",
        description: "Failed to save hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStructured = async () => {
    if (!weekHours) return;
    
    setIsSaving(true);
    try {
      const hoursString = stringifyWeekHours(weekHours);
      
      // Update doctor_metadata table
      const { error } = await supabase
        .from('doctor_metadata')
        .upsert({
          doctor_id: doctorId,
          hours: hoursString,
          address: '', // Keep existing or set empty if new
          city: '',
          postal_code: ''
        });

      if (error) throw error;

      setHoursText(hoursString);
      
      toast({
        title: "Hours updated",
        description: "Doctor hours have been saved successfully.",
      });
      
      if (setIsEditing) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving hours:', error);
      toast({
        title: "Error",
        description: "Failed to save hours. Please try again.",
        variant: "destructive",
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
