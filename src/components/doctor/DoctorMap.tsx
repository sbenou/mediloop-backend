
import React from 'react';
import { MapPin } from 'lucide-react';

interface DoctorMapProps {
  doctor: {
    address?: string;
    city?: string;
    postal_code?: string;
  };
}

const DoctorMap: React.FC<DoctorMapProps> = ({ doctor }) => {
  const hasLocationInfo = Boolean(doctor.address || doctor.city || doctor.postal_code);
  const address = [doctor.address, doctor.city, doctor.postal_code]
    .filter(Boolean)
    .join(', ');
    
  const mapUrl = hasLocationInfo
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : '';

  if (!hasLocationInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No location information</h3>
        <p className="text-sm text-muted-foreground">
          Edit your profile to add your address details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <p className="font-medium">{doctor.address}</p>
        <p>
          {doctor.city}
          {doctor.postal_code && `, ${doctor.postal_code}`}
        </p>
      </div>
      
      <div className="h-64 w-full overflow-hidden rounded-lg border">
        {mapUrl ? (
          <iframe
            title="Doctor Location"
            className="w-full h-full border-0"
            src={mapUrl}
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <p className="text-muted-foreground">Map could not be loaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorMap;
