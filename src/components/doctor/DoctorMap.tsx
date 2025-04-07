
import React from 'react';

interface DoctorMapProps {
  doctor: {
    address: string;
    city: string;
    postal_code: string;
  };
}

const DoctorMap: React.FC<DoctorMapProps> = ({ doctor }) => {
  // In a real implementation, we would use the address to show a map
  // For now, we'll just display the address
  
  return (
    <div className="h-48 bg-muted rounded-md flex items-center justify-center">
      <p className="text-muted-foreground">
        Map showing location at {doctor.address}, {doctor.city}, {doctor.postal_code}
      </p>
    </div>
  );
};

export default DoctorMap;
