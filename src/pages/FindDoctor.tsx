
import React, { useState, useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { userLocationState, isUsingLocationState } from '@/store/location/atoms';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/auth/useAuth';
import { useDoctorFinder } from '@/hooks/useDoctorFinder';
import { DoctorFinderMap } from '@/components/doctor/finder/DoctorFinderMap';
import { DoctorSearch } from '@/components/doctor/finder/DoctorSearch';
import type { Doctor } from '@/lib/types/overpass.types';
import { useQuery } from '@tanstack/react-query';

const FindDoctor = () => {
  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const [isUsingLocation, setIsUsingLocation] = useRecoilState(isUsingLocationState);
  
  const { isAuthenticated, profile } = useAuth();
  const [showLocation, setShowLocation] = useState(false);
  
  // Use our custom hook for doctor finding logic
  const { 
    doctors, 
    filteredDoctors,
    isLoading, 
    error,
    searchQuery,
    setSearchQuery,
    useLocationFilter,
    setUseLocationFilter
  } = useDoctorFinder(userLocation);

  // Show error if API fails
  useEffect(() => {
    if (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error loading doctors",
        description: "There was a problem loading doctor data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error]);

  const handleConnectDoctor = (doctorId: string, source?: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to connect with doctors.",
      });
      return;
    }

    if (source === 'overpass') {
      toast({
        title: "Information",
        description: "Connection requests are only available for registered doctors.",
      });
      return;
    }
    
    toast({
      title: "Connect with Doctor",
      description: `Request sent to doctor`,
    });
  };

  const toggleLocationDisplay = (checked: boolean) => {
    setShowLocation(checked);
  };

  // Fetch user's default doctor (could be implemented later)
  const { data: defaultDoctor } = useQuery({
    queryKey: ['defaultDoctor', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      // This could fetch the user's default doctor in the future
      return null;
    },
  });

  const currentCoordinates = userLocation || { lat: 49.8153, lon: 6.1296 };

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      
      <main className="flex-1 w-full">
        <DoctorSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          useLocationFilter={useLocationFilter}
          setUseLocationFilter={setUseLocationFilter}
          userLocation={userLocation}
        />
        
        <div className="container mx-auto py-8 px-4">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Switch
                id="location-toggle"
                checked={showLocation}
                onCheckedChange={toggleLocationDisplay}
              />
              <Label htmlFor="location-toggle">Show my location</Label>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading doctors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
                {/* Doctor List */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  {filteredDoctors.length === 0 ? (
                    <p className="text-center py-8">No doctors found</p>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <Card key={doctor.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                            {doctor.license_number && (
                              <p className="font-medium">License: {doctor.license_number}</p>
                            )}
                            
                            {(doctor.address || doctor.city) && (
                              <p className="text-sm text-gray-500">
                                📍 {doctor.address || doctor.city}
                              </p>
                            )}
                            
                            {doctor.phone && (
                              <p className="text-sm">📞 {doctor.phone}</p>
                            )}
                            
                            {doctor.email && (
                              <p className="text-sm">✉️ {doctor.email}</p>
                            )}
                            
                            {doctor.hours && (
                              <p className="text-sm">⏰ {doctor.hours}</p>
                            )}
                            
                            {doctor.distance !== undefined && (
                              <p className="text-sm font-medium">
                                📍 {typeof doctor.distance === 'number' ? `${doctor.distance.toFixed(1)} km` : doctor.distance}
                              </p>
                            )}
                            
                            <Button
                              onClick={() => handleConnectDoctor(doctor.id, doctor.source)}
                              className="w-full mt-4"
                            >
                              Connect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                
                {/* Map */}
                <div className="h-full">
                  <Card className="p-1 shadow-sm h-full">
                    <CardContent className="p-0 h-full relative">
                      <DoctorFinderMap
                        doctors={filteredDoctors}
                        userLocation={showLocation ? currentCoordinates : null}
                        useLocationFilter={useLocationFilter}
                        onDoctorSelect={(doctorId, source) => handleConnectDoctor(doctorId, source)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FindDoctor;
