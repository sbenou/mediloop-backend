
import React, { Dispatch, SetStateAction } from 'react';
import { useHours } from './useHours';
import { TextEditor } from './TextEditor';
import { DoctorHoursDisplay } from './DoctorHoursDisplay';
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
  const {
    hoursText,
    setHoursText,
    weekHours,
    setWeekHours,
    formattedHours,
    isSaving,
    isStructuredFormat,
    handleSaveText,
    handleSaveStructured
  } = useHours(hours, doctorId, setIsEditing);

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
    return (
      <TextEditor 
        hoursText={hoursText}
        onHoursTextChange={setHoursText}
        onCancel={() => setIsEditing && setIsEditing(false)}
        onSave={handleSaveText}
        isSaving={isSaving}
      />
    );
  }

  return (
    <DoctorHoursDisplay hours={hours} formattedHours={formattedHours} />
  );
};

export default DoctorHours;
