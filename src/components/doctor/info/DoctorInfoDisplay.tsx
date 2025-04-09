
import React from 'react';

interface DoctorInfoDisplayProps {
  doctor: {
    name: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string | null;
    email?: string;
  };
}

export const DoctorInfoDisplay: React.FC<DoctorInfoDisplayProps> = ({ doctor }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{doctor.name}</h3>
        {doctor.email && (
          <p className="text-sm text-muted-foreground">{doctor.email}</p>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        {doctor.address && (
          <p>{doctor.address}</p>
        )}
        {(doctor.city || doctor.postal_code) && (
          <p>
            {doctor.city}
            {doctor.city && doctor.postal_code && ", "}
            {doctor.postal_code}
          </p>
        )}
        
        {doctor.phone && (
          <p className="pt-2">
            <span className="font-medium">Phone:</span> {doctor.phone}
          </p>
        )}
      </div>
      
      {(!doctor.address && !doctor.city && !doctor.postal_code && !doctor.phone) && (
        <p className="text-sm text-muted-foreground italic">
          No contact information available. Click edit to add details.
        </p>
      )}
    </div>
  );
};
