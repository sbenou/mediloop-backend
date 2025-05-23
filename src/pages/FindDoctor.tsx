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
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DoctorMap from "@/components/doctor/DoctorMap";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

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
  
  const [searchRadius, setSearchRadius] = useState(5000); // Start with a larger radius
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

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
  
  // Create computed search coordinates
  const currentCoordinates = coordinates 
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
    isUsingLocation ? currentCoordinates : null, 
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
          setShowLocation(true);
        }
        
        setInitialLocationSet(true);
        return;
      }
      
      // Otherwise fall back to profile city or session-based initialization
      if (!coordinates) {
        // Fall back to default location
        if (userProfile?.city) {
          console.log('Using profile city:', userProfile.city);
          handleCitySearch(userProfile.city);
        } else {
          console.log('Using default city: Luxembourg City');
          handleCitySearch("Luxembourg City");
        }
        
        // Start with location-based search off by default
        setIsUsingLocation(false);
        setShowLocation(false);
      }
      
      setInitialLocationSet(true);
    } catch (error) {
      console.error("Error initializing location:", error);
      // Fallback to default location
      setIsUsingLocation(false);
      setShowLocation(false);
      handleCitySearch("Luxembourg City");
      setInitialLocationSet(true);
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
      searchRadius < 20000 &&  // Increased max radius
      !isSearching && 
      !isDoctorsLoading
    ) {
      const newRadius = Math.min(searchRadius + 5000, 20000);
      console.log(`Increasing radius from ${searchRadius} to ${newRadius} because no doctors found`);
      setSearchRadius(newRadius);
    }
  }, [doctors, searchRadius, isDoctorsLoading, isSearching]);

  // Handle location toggle
  const toggleLocationDisplay = useCallback((checked: boolean) => {
    setShowLocation(checked);
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
              description: "Showing doctors near you",
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
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
      setSearchRadius(5000);
    } else {
      // When disabling location-based search
      setIsUsingLocation(false);
    }
  }, [setIsUsingLocation, setUserLocation]);

  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
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
  };

  const handleSetDoctorAsDefault = async (doctorId: string, isDefault: boolean) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to set a default doctor.",
      });
      return;
    }

    try {
      if (isDefault) {
        toast({
          title: "Default Doctor Set",
          description: "Your default doctor has been updated.",
        });
      } else {
        toast({
          title: "Default Doctor Removed",
          description: "Your default doctor has been removed.",
        });
      }
    } catch (err) {
      console.error('Error setting default doctor:', err);
      toast({
        title: "Error",
        description: "Failed to update default doctor",
        variant: "destructive"
      });
    }
  };

  // For debugging
  console.log(`Rendering doctors in ${selectedCountry || 'unknown country'}, found ${doctors?.length || 0} doctors, using location: ${isUsingLocation}`);
  console.log('Current coordinates for search:', currentCoordinates);

  // Force a search if no results after initialization
  useEffect(() => {
    if (initialLocationSet && Array.isArray(doctors) && doctors.length === 0 && !isDoctorsLoading && !isSearching) {
      console.log('No doctors found after initialization, triggering a country-wide search');
      setIsUsingLocation(false); // Disable location-based search to fall back to country search
      handleCitySearch("Luxembourg City"); // Force search for Luxembourg City
    }
  }, [initialLocationSet, doctors, isDoctorsLoading, isSearching]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full">
        <SearchHeader 
          onSearch={handleCitySearch} 
          title="Find a Doctor Near You" 
        />
        
        <div className="container mx-auto px-4 py-8">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Switch
                id="location-toggle"
                checked={showLocation}
                onCheckedChange={toggleLocationDisplay}
              />
              <Label htmlFor="location-toggle">Show my location</Label>
            </div>
            
            {isSearching || isAddressLoading ? (
              <div className="flex justify-center items-center h-64">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6">
                {/* Doctor List */}
                <div className="space-y-4 overflow-y-auto pr-2 h-[calc(100vh-220px)]">
                  {isDoctorsLoading && (
                    <>
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-40 w-full" />
                    </>
                  )}
                  
                  {!isDoctorsLoading && Array.isArray(doctors) && doctors.length > 0 ? doctors.map((doctor) => (
                    <Card 
                      key={doctor.id} 
                      className={`overflow-hidden ${selectedDoctorId === doctor.id ? 'ring-2 ring-primary shadow-md' : ''}`}
                      onClick={() => setSelectedDoctorId(doctor.id)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 mb-4">
                            <Checkbox
                              id={`default-${doctor.id}`}
                              checked={false} 
                              onCheckedChange={(checked) => 
                                handleSetDoctorAsDefault(doctor.id, !!checked)
                              }
                            />
                            <Label htmlFor={`default-${doctor.id}`}>Set as default doctor</Label>
                          </div>
                          
                          <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                          
                          {doctor.address && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {doctor.address}
                            </p>
                          )}
                          
                          {doctor.city && !doctor.address && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {doctor.city || "Unknown location"}
                            </p>
                          )}
                          
                          {doctor.license_number && (
                            <p className="text-sm">License: {doctor.license_number}</p>
                          )}
                          
                          {doctor.phone && (
                            <p className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              {doctor.phone}
                            </p>
                          )}
                          
                          {doctor.email && (
                            <p className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {doctor.email}
                            </p>
                          )}
                          
                          {doctor.hours && (
                            <p className="text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {doctor.hours}
                            </p>
                          )}
                          
                          {doctor.distance && (
                            <p className="text-sm font-medium">📍 {doctor.distance} km</p>
                          )}
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDoctor(doctor.id);
                            }}
                            className="w-full mt-4"
                            variant="default"
                          >
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-lg mb-4">
                        {isDoctorsLoading 
                          ? "Loading doctors..." 
                          : isUsingLocation
                            ? "No doctors found nearby. Try disabling location to see doctors in the country."
                            : `No doctors found in ${selectedCountry || 'selected country'}.`}
                      </p>
                      
                    </div>
                  )}
                </div>
                
                {/* Map */}
                <div className="h-[calc(100vh-220px)]">
                  <DoctorMap 
                    doctors={doctors || []} 
                    userCoordinates={showLocation ? currentCoordinates : null}
                    showUserLocation={showLocation}
                    onDoctorSelect={handleSelectDoctor}
                  />
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
