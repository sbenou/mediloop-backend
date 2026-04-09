
import React, { useState } from 'react';
import { DoctorInfoDisplay } from './info/DoctorInfoDisplay';
import { DoctorInfoForm } from './info/DoctorInfoForm';
import { useDoctorInfo } from './info/useDoctorInfo';

interface DoctorInfoProps {
  doctor: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string | null;
    email?: string;
  };
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onSaved?: () => void;
}

const DoctorInfo = ({ doctor, isEditing, setIsEditing, onSaved }: DoctorInfoProps) => {
  const { isSubmitting, handleSave } = useDoctorInfo(doctor.id, onSaved);

  if (isEditing) {
    return (
      <DoctorInfoForm
        doctor={doctor}
        isSubmitting={isSubmitting}
        onCancel={() => setIsEditing(false)}
        onSave={(formData) => {
          handleSave(formData).then(success => {
            if (success) {
              setIsEditing(false);
            }
          });
        }}
      />
    );
  }

  return <DoctorInfoDisplay doctor={doctor} />;
};

export default DoctorInfo;
