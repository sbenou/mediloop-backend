
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, Star } from "lucide-react";

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
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found in {searchCity}
      </div>
      
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="group hover:shadow-md transition-all duration-200 border border-gray-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-base text-gray-900 group-hover:text-primary transition-colors">
                      {doctor.full_name}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      <span>{doctor.city || doctor.address || 'Location not specified'}</span>
                      {doctor.distance && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {typeof doctor.distance === 'number' ? `${doctor.distance} km` : doctor.distance}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">4.8</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {doctor.license_number && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">License:</span> {doctor.license_number}
                    </div>
                  )}
                  
                  {doctor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {doctor.phone}
                    </div>
                  )}
                  
                  {doctor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  )}
                  
                  {doctor.hours && (
                    <div className="flex items-start text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <span className="font-medium text-gray-700">Hours:</span>
                        <div className="text-xs mt-1 text-gray-500">
                          {doctor.hours.split('\n').map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={doctor.source === 'database' ? 'default' : 'outline'} className="text-xs">
                      {doctor.source === 'database' ? 'Verified' : 'Listed'}
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => onConnect(doctor.id, doctor.source || 'database')}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DoctorList;
