
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, UserPlus } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  city?: string;
  license_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  distance?: number;
  source?: 'database' | 'overpass';
}

interface DoctorFinderListProps {
  doctors: Doctor[];
  isLoading: boolean;
  userLocation: { lat: number; lon: number } | null;
  onConnect: (doctorId: string, source?: string) => void;
}

export const DoctorFinderList = ({
  doctors,
  isLoading,
  userLocation,
  onConnect
}: DoctorFinderListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl font-medium text-gray-600">No doctors found matching your criteria</p>
        <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">{doctor.full_name}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              {doctor.license_number && (
                <p className="font-medium">License: {doctor.license_number}</p>
              )}
              
              {(doctor.address || doctor.city) && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{doctor.address || doctor.city}</span>
                </p>
              )}
              
              {doctor.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{doctor.phone}</span>
                </p>
              )}
              
              {doctor.email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="break-all">{doctor.email}</span>
                </p>
              )}
              
              {doctor.hours && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{doctor.hours}</span>
                </p>
              )}

              {doctor.distance !== undefined && (
                <p className="font-medium">📍 {typeof doctor.distance === 'number' ? `${doctor.distance.toFixed(1)} km` : doctor.distance}</p>
              )}
            </div>
            
            <Button 
              onClick={() => onConnect(doctor.id, doctor.source)}
              className="w-full mt-4 flex items-center justify-center gap-2"
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
              Connect
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
