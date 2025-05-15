
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import DoctorMap from "./DoctorMap";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateDistance } from '@/lib/utils/distance';

interface Doctor {
  id: string;
  full_name: string;
  license_number?: string;
  city?: string | null;
  address?: string;
  distance?: string;
  source?: 'database' | 'overpass';
  coordinates?: { lat: number; lon: number } | null;
}

interface DoctorListSectionProps {
  doctors: Doctor[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number };
  showUserLocation: boolean;
  onConnect?: (doctorId: string, source?: 'database' | 'overpass') => void;
}

const DoctorListSection: React.FC<DoctorListSectionProps> = ({
  doctors,
  isLoading,
  coordinates,
  showUserLocation,
  onConnect
}) => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  
  // Filter and enhance doctors with coordinates and distance
  useEffect(() => {
    if (!doctors || !Array.isArray(doctors)) return;
    
    try {
      // Add coordinates and distance to doctors
      const enhancedDoctors = doctors.map(doctor => {
        // For each doctor, calculate their distance from the user if we have coordinates
        let distance = null;
        
        // Try to get coordinates from the doctor data, if available
        // This will be available for Overpass results but may not be for database results
        const doctorCoordinates = doctor.coordinates || null;
        
        if (coordinates && doctorCoordinates) {
          try {
            distance = calculateDistance(
              coordinates.lat,
              coordinates.lon,
              doctorCoordinates.lat,
              doctorCoordinates.lon
            );
          } catch (error) {
            console.error('Error calculating distance:', error);
          }
        }
        
        return {
          ...doctor,
          distance
        };
      });
      
      // Sort by distance if available
      const sortedDoctors = enhancedDoctors.sort((a, b) => {
        if (a.distance && b.distance) {
          // Extract numeric values from distance strings like "2.3 km"
          const aDistance = parseFloat(a.distance.split(' ')[0]);
          const bDistance = parseFloat(b.distance.split(' ')[0]);
          return aDistance - bDistance;
        }
        return 0;
      });
      
      // Apply search filter if any
      const filtered = searchTerm 
        ? sortedDoctors.filter(doctor => 
            doctor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.city?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : sortedDoctors;
      
      setFilteredDoctors(filtered);
    } catch (error) {
      console.error('Error filtering doctors:', error);
      setFilteredDoctors(doctors);
    }
  }, [doctors, searchTerm, coordinates]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[400px] w-full">
          <Skeleton className="h-full w-full" />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search doctors by name or specialty..."
          className="w-full p-2 border border-gray-300 rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <DoctorMap
        doctors={filteredDoctors}
        userCoordinates={showUserLocation ? coordinates : null}
        showUserLocation={showUserLocation}
      />
      
      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-semibold">
          {filteredDoctors.length} Doctors Found
        </h2>
        
        {filteredDoctors.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <MapPin className="h-10 w-10 text-gray-400 mx-auto" />
            <p className="mt-2 text-gray-600">No doctors found in this area</p>
            <p className="text-sm text-gray-500">Try expanding your search radius</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <div 
                key={doctor.id} 
                className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{doctor.full_name}</h3>
                    
                    <div className="text-sm text-gray-600 mt-1">
                      {doctor.license_number && (
                        <p>License: {doctor.license_number}</p>
                      )}
                      
                      {doctor.city && (
                        <p>Location: {doctor.city}</p>
                      )}
                      
                      {doctor.distance && (
                        <p>Distance: {doctor.distance}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Button
                      onClick={() => {
                        if (onConnect) {
                          onConnect(doctor.id, doctor.source);
                        } else {
                          if (!isAuthenticated) {
                            toast({
                              title: "Login Required",
                              description: "Please login to connect with doctors."
                            });
                          } else {
                            toast({
                              description: `Connecting with Dr. ${doctor.full_name}`
                            });
                          }
                        }
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorListSection;
