import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRecoilState, useRecoilValue } from 'recoil';
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useDoctorSearch } from "@/hooks/useDoctorSearch";
import { usePharmacyState, LUXEMBOURG_COORDINATES } from "@/hooks/usePharmacyState";
import { userLocationState, isUsingLocationState, selectedCountryState } from "@/store/location/atoms";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchHeader from "@/components/pharmacy/SearchHeader";
import DoctorListSection from "@/components/doctor/DoctorListSection";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { LocationToggle } from "@/components/shared/LocationToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DoctorMap from "@/components/doctor/DoctorMap";

const FindDoctor = () => {
  const { isAuthenticated, profile } = useAuth();
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
      } catch (error) {
        console.error('Error fetching session:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const [isUsingLocation, setIsUsingLocation] = useRecoilState(isUsingLocationState);
  const selectedCountry = useRecoilValue(selectedCountryState);
  const { userProfile } = usePharmacyState(session);
  
  const [searchRadius, setSearchRadius] = useState(2000);
  const [initialLocationSet, setInitialLocationSet] = useState(false);

  const { coordinates, handleCitySearch, isSearching } = useLocationSearch();

  // Get user's default address if available
  const { data: userAddresses, isLoading: isAddressLoading } = useQuery({
    queryKey: ['user-addresses', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', profile.id)
          .eq('is_default', true)
          .limit(1);
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching user addresses:', error);
        return [];
      }
    },
    enabled: !!profile?.id && isAuthenticated,
  });
  
  // Create computed search coordinates - ensure consistent number types
  const searchCoordinates = coordinates 
    ? { 
        lat: Number(coordinates.lat), 
        lon: Number(coordinates.lon) 
      } 
    : userLocation 
      ? {
          lat: Number(userLocation.lat),
          lon: Number(userLocation.lon)
        }
      : {
          lat: Number(LUXEMBOURG_COORDINATES.lat),
          lon: Number(LUXEMBOURG_COORDINATES.lon)
        };

  const { doctors, isLoading: isDoctorsLoading } = useDoctorSearch(
    isUsingLocation ? searchCoordinates : null, 
    searchRadius
  );
  
  // Initialize location based on session/profile
  useEffect(() => {
    if (initialLocationSet) {
      return; // Don't re-initialize if already done
    }

    try {
      // First try to use user's default address if available
      if (isAuthenticated && userAddresses && userAddresses.length > 0) {
        const defaultAddress = userAddresses[0];
        console.log('Using user default address:', defaultAddress);
        
        // Use the default address to search for doctors
        if (defaultAddress.city) {
          handleCitySearch(defaultAddress.city);
          setIsUsingLocation(true);
        }
        
        setInitialLocationSet(true);
        return;
      }
      
      // Otherwise fall back to profile city or session-based initialization
      if (!session) {
        setUserLocation(LUXEMBOURG_COORDINATES);
        setIsUsingLocation(false);
        
        if (!coordinates) {
          handleCitySearch("Luxembourg City");
        }
      } else if (!coordinates && userProfile?.city) {
        handleCitySearch(userProfile.city);
      } else if (!coordinates) {
        // Fallback to ensure we always have coordinates
        handleCitySearch("Luxembourg City");
      }
      
      setInitialLocationSet(true);
    } catch (error) {
      console.error("Error initializing location:", error);
      // Fallback to default location
      setUserLocation(LUXEMBOURG_COORDINATES);
      setIsUsingLocation(false);
      handleCitySearch("Luxembourg City");
    }
  }, [
    session, 
    coordinates, 
    userProfile?.city, 
    setUserLocation, 
    setIsUsingLocation, 
    handleCitySearch, 
    initialLocationSet, 
    isAuthenticated, 
    userAddresses
  ]);

  // Increase search radius when no doctors found
  useEffect(() => {
    // Check if no doctors found and we haven't reached max radius
    if (
      Array.isArray(doctors) && 
      doctors.length === 0 && 
      searchRadius < 10000 &&
      !isSearching && 
      !isDoctorsLoading &&
      isUsingLocation // Only auto-expand when in location mode
    ) {
      const newRadius = Math.min(searchRadius + 2000, 10000);
      console.log(`Increasing radius from ${searchRadius} to ${newRadius}`);
      setSearchRadius(newRadius);
    }
  }, [doctors, searchRadius, isDoctorsLoading, isSearching, isUsingLocation]);

  // Handle location toggle
  const handleLocationToggle = useCallback((checked: boolean) => {
    setIsUsingLocation(checked);
    if (checked) {
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
              description: "Showing locations near you",
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            setUserLocation(LUXEMBOURG_COORDINATES);
            setIsUsingLocation(false);
            toast({
              title: "Location Error",
              description: "Could not get your location. Using default location instead.",
              variant: "destructive",
            });
          }
        );
      }
      
      // Reset search radius when enabling location
      setSearchRadius(2000);
    } else {
      // When disabling location-based search
      setIsUsingLocation(false);
    }
  }, [setIsUsingLocation, setUserLocation]);

  console.log(`Rendering doctors in ${selectedCountry || 'unknown country'}, found ${doctors?.length || 0} doctors`);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="w-full max-w-6xl mx-auto">
            <SearchHeader onSearch={handleCitySearch} title="Find a Doctor Near You" />
            
            <div className="flex flex-col md:flex-row gap-4 items-start justify-between mb-4">
              <LocationToggle
                showDefaultLocation={isUsingLocation}
                onLocationToggle={handleLocationToggle}
              />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCountry ? `Showing doctors in ${selectedCountry}` : 'Select a country on the home page'}
                </span>
              </div>
            </div>
            
            <div className="w-full mt-6">
              {isSearching || isAddressLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6">
                  <div className="space-y-4 overflow-y-auto pr-2 h-[calc(100vh-220px)]">
                    {Array.isArray(doctors) && doctors.length > 0 ? doctors.map((doctor) => (
                      <Card key={doctor.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-2">  
                            <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                            <p className="text-sm text-gray-500">{doctor.city || "Unknown location"}</p>
                            {doctor.license_number && (
                              <p className="text-sm">{doctor.license_number}</p>
                            )}
                            
                            {isAuthenticated && doctor.source === 'database' && (
                              <Button
                                onClick={() => {
                                  toast({
                                    title: "Connect with Doctor",
                                    description: `Request sent to ${doctor.full_name}`,
                                  });
                                }}
                                className="w-full mt-4"
                                size="sm"
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <p className="text-center py-8">
                        {isUsingLocation
                          ? "No doctors found nearby. Try expanding your search radius."
                          : `No doctors found in ${selectedCountry || 'selected country'}.`}
                      </p>
                    )}
                  </div>
                  
                  <div className="h-[calc(100vh-220px)]">
                    <DoctorMap 
                      doctors={doctors || []} 
                      userCoordinates={isUsingLocation ? searchCoordinates : null}
                      showUserLocation={isUsingLocation}
                      onDoctorSelect={(doctorId) => {
                        const doctor = doctors?.find(d => d.id === doctorId);
                        if (doctor) {
                          if (!isAuthenticated) {
                            toast({
                              title: "Login Required",
                              description: "Please login to connect with doctors.",
                            });
                            return;
                          }

                          if (doctor.source === 'overpass') {
                            toast({
                              title: "Information",
                              description: "Connection requests are only available for registered doctors.",
                            });
                            return;
                          }
                          
                          toast({
                            title: "Connect with Doctor",
                            description: `Request sent to ${doctor.full_name}`,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindDoctor;
