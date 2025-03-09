
import React from 'react';
import { MapPin } from 'lucide-react';

interface PharmacyMapProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
  };
}

const PharmacyMap: React.FC<PharmacyMapProps> = ({ pharmacy }) => {
  return (
    <div className="space-y-3">
      <div className="bg-gray-200 h-32 rounded-md flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm text-gray-600 mt-1">Map view coming soon</p>
        </div>
      </div>
      <p className="text-sm text-center">{pharmacy.address}, {pharmacy.city} {pharmacy.postal_code}</p>
    </div>
  );
};

export default PharmacyMap;
