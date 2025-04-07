
import React, { Dispatch, SetStateAction, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

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
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    if (!doctorId) return;
    
    try {
      setIsSaving(true);
      
      console.log('Saving hours with doctor_id:', doctorId);
      
      // First check if a record exists for this doctor
      const { data: existingData, error: fetchError } = await supabase
        .from('doctor_metadata')
        .select('id')
        .eq('doctor_id', doctorId)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error checking for existing record:', fetchError);
        throw fetchError;
      }
      
      let result;
      
      if (existingData) {
        // Update existing record
        console.log('Updating existing doctor_metadata record:', existingData.id);
        result = await supabase
          .from('doctor_metadata')
          .update({ 
            hours: hoursText,
            updated_at: new Date().toISOString()
          })
          .eq('doctor_id', doctorId);
      } else {
        // Insert new record
        console.log('Creating new doctor_metadata record');
        result = await supabase
          .from('doctor_metadata')
          .insert({ 
            doctor_id: doctorId,
            hours: hoursText,
            updated_at: new Date().toISOString()
          });
      }
      
      const { error } = result;
      
      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }
      
      console.log('Hours saved successfully');
      
      toast({
        title: "Success",
        description: "Consultation hours updated successfully",
      });
      
      if (setIsEditing) setIsEditing(false);
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update consultation hours",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
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
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  // Display consultation hours
  if (!hours || hours.trim() === '') {
    return (
      <div className="text-muted-foreground italic">
        No consultation hours set. Click edit to add consultation hours.
      </div>
    );
  }

  // Attempt to parse the hours into lines
  const hoursLines = hours.split(/\r?\n/);

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

export default DoctorHours;
