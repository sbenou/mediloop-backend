
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
      
      // Update doctor_metadata table with new hours
      const { error } = await supabase
        .from('doctor_metadata')
        .upsert({ 
          doctor_id: doctorId,
          hours: hoursText,
          updated_at: new Date()
        });

      if (error) throw error;
      
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
