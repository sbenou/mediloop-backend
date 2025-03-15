
import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Doctor {
  id: string;
  name: string;
}

interface DoctorSelectorProps {
  doctors: Doctor[];
  selectedDoctorId?: string;
  onDoctorChange: (doctorId: string) => void;
}

const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  doctors,
  selectedDoctorId,
  onDoctorChange
}) => {
  if (doctors.length === 0) {
    return null;
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="doctorSelect">Doctor:</Label>
      <Select
        value={selectedDoctorId}
        onValueChange={onDoctorChange}
        disabled={doctors.length === 0}
      >
        <SelectTrigger className="w-[220px]" id="doctorSelect">
          <SelectValue placeholder="Select a doctor" />
        </SelectTrigger>
        <SelectContent>
          {doctors.map(doctor => (
            <SelectItem key={doctor.id} value={doctor.id}>
              {doctor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DoctorSelector;
