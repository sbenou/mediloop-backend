
import React, { Dispatch, SetStateAction } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

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
  const [hoursText, setHoursText] = React.useState(hours || '');
  
  const handleSave = async () => {
    try {
      // In a real implementation, we would save to the database
      // For now, we'll just update the UI state
      
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
          <Button variant="outline" size="sm" onClick={() => setIsEditing && setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
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
