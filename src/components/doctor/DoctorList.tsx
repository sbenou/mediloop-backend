
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  distance?: number;
  source?: 'database' | 'overpass';
  coordinates?: { lat: number; lon: number } | null;
  address?: string;
}

interface DoctorListProps {
  doctors: Doctor[];
  isLoading: boolean;
  onConnect: (doctorId: string, source: 'database' | 'overpass') => void;
  searchCity: string;
}

const DoctorList = ({ doctors, isLoading, onConnect, searchCity }: DoctorListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try expanding your search area or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{doctor.full_name}</h3>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {doctor.city || doctor.address || 'Location not specified'}
                {doctor.distance && (
                  <span className="ml-2 text-primary font-medium">
                    {typeof doctor.distance === 'number' ? `${doctor.distance} km` : doctor.distance}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {doctor.license_number && (
              <p className="text-sm text-gray-600">
                License: {doctor.license_number}
              </p>
            )}
            
            {doctor.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {doctor.phone}
              </div>
            )}
            
            {doctor.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {doctor.email}
              </div>
            )}
            
            {doctor.hours && (
              <div className="flex items-start text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Opening Hours:</p>
                  <div className="text-xs text-gray-500">
                    {doctor.hours.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={() => onConnect(doctor.id, doctor.source || 'database')}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Connect
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default DoctorList;
