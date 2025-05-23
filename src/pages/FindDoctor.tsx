
import React, { useState, useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { userLocationState, isUsingLocationState } from '@/store/location/atoms';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/auth/useAuth';
import { useDoctorFinder } from '@/hooks/useDoctorFinder';
import { DoctorFinderMap } from '@/components/doctor/finder/DoctorFinderMap';
import SearchHeader from '@/components/pharmacy/SearchHeader';
import { LocationToggle } from '@/components/shared/LocationToggle';

const FindDoctor = () => {
  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const [isUsingLocation, setIsUsingLocation] = useRecoilState(isUsingLocationState);
  
  const { isAuthenticated } = useAuth();
  const [searchCity, setSearchCity] = useState<string>('');
  
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

  const handleCitySearch = (city: string) => {
    setSearchCity(city);
    setSearchQuery(city);
  };

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

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      
      <main className="flex-1 w-full">
        <div className="container mx-auto py-8 px-4">
          <SearchHeader onSearch={handleCitySearch} title="Find a Doctor Near You" />
          
          <LocationToggle
            showDefaultLocation={isUsingLocation}
            onLocationToggle={(checked) => {
              if (!checked) {
                setUserLocation({ lat: 49.8153, lon: 6.1296 }); // Luxembourg default
                setIsUsingLocation(false);
              } else {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setUserLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                      });
                      setIsUsingLocation(true);
                      toast({
                        title: "Using your location",
                        description: "Showing doctors near you",
                      });
                    },
                    (error) => {
                      console.error('Geolocation error:', error);
                      setUserLocation({ lat: 49.8153, lon: 6.1296 });
                      setIsUsingLocation(false);
                      toast({
                        title: "Location Error",
                        description: "Could not get your location. Using default location instead.",
                        variant: "destructive",
                      });
                    }
                  );
                }
              }
            }}
          />
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading doctors...</p>
            </div>
          ) : (
            <div className="w-full max-w-6xl mx-auto h-[600px]">
              <DoctorFinderMap
                doctors={filteredDoctors}
                userLocation={isUsingLocation ? userLocation : null}
                useLocationFilter={useLocationFilter}
                onDoctorSelect={(doctorId, source) => handleConnectDoctor(doctorId, source)}
              />
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FindDoctor;
