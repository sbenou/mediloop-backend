
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRecoilState } from 'recoil';
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useDoctorSearch } from "@/hooks/useDoctorSearch";
import { usePharmacyState, LUXEMBOURG_COORDINATES } from "@/hooks/usePharmacyState";
import { userLocationState, isUsingLocationState } from "@/store/location/atoms";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SearchHeader from "@/components/pharmacy/SearchHeader";
import DoctorListSection from "@/components/doctor/DoctorListSection";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { LocationToggle } from "@/components/shared/LocationToggle";
import { Skeleton } from "@/components/ui/skeleton";

const FindDoctor = () => {
  const { isAuthenticated } = useAuth();
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
  const { userProfile } = usePharmacyState(session);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Refs for managing updates safely
  const radiusUpdateAllowedRef = useRef(true);
  const radiusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchRadius, setSearchRadiusState] = useState(2000);
  const [initialLocationSet, setInitialLocationSet] = useState(false);

  const { coordinates, handleCitySearch, isSearching } = useLocationSearch();

  // Wrapper for safer state updates
  const setSearchRadius = useCallback((value: number | ((prev: number) => number)) => {
    // Clear any pending timers
    if (radiusTimerRef.current) {
      clearTimeout(radiusTimerRef.current);
      radiusTimerRef.current = null;
    }
    
    setSearchRadiusState(value);
  }, []);

  // Safely create search coordinates with validation
  const searchCoordinates = useMemo(() => {
    try {
      if (coordinates?.lat && coordinates?.lon) {
        return { 
          lat: String(coordinates.lat), 
          lon: String(coordinates.lon) 
        };
      }
      
      if (userLocation?.lat && userLocation?.lon) {
        return {
          lat: String(userLocation.lat),
          lon: String(userLocation.lon)
        };
      }
      
      // Default to Luxembourg
      return {
        lat: String(LUXEMBOURG_COORDINATES.lat),
        lon: String(LUXEMBOURG_COORDINATES.lon)
      };
    } catch (error) {
      console.error("Error creating search coordinates:", error);
      return {
        lat: String(LUXEMBOURG_COORDINATES.lat),
        lon: String(LUXEMBOURG_COORDINATES.lon)
      };
    }
  }, [coordinates, userLocation]);

  const { doctors, isLoading: isDoctorsLoading } = useDoctorSearch(searchCoordinates, searchRadius);

  // Handle session-based location initialization
  useEffect(() => {
    if (initialLocationSet) {
      return; // Don't re-initialize if already done
    }

    try {
      if (!session) {
        console.log('No session, setting default location');
        setUserLocation(LUXEMBOURG_COORDINATES);
        setIsUsingLocation(false);
        
        if (!coordinates) {
          handleCitySearch("Luxembourg City");
        }
      } else if (!coordinates && userProfile?.city) {
        console.log('Using profile city:', userProfile.city);
        handleCitySearch(userProfile.city);
      } else if (!coordinates) {
        // Fallback to ensure we always have some coordinates
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
  }, [session, coordinates, userProfile?.city, setUserLocation, setIsUsingLocation, handleCitySearch, initialLocationSet]);

  // Handle search radius updates only when we have data and no doctors are found
  useEffect(() => {
    // Check if no doctors found and we haven't reached max radius
    if (
      Array.isArray(doctors) && 
      doctors.length === 0 && 
      searchRadius < 10000 &&
      !isSearching && 
      !isDoctorsLoading &&
      radiusUpdateAllowedRef.current
    ) {
      console.log('No doctors found, will try increasing search radius');
      
      // Disable radius updates temporarily
      radiusUpdateAllowedRef.current = false;
      
      // Schedule radius increase with a safe delay
      radiusTimerRef.current = setTimeout(() => {
        console.log(`Increasing radius from ${searchRadius} to ${Math.min(searchRadius + 2000, 10000)}`);
        setSearchRadiusState(prevRadius => Math.min(prevRadius + 2000, 10000));
        
        // Re-enable radius updates after a delay
        setTimeout(() => {
          radiusUpdateAllowedRef.current = true;
        }, 3000);
      }, 1500);
    }
    
    // Clean up timer on component unmount
    return () => {
      if (radiusTimerRef.current) {
        clearTimeout(radiusTimerRef.current);
      }
    };
  }, [doctors, searchRadius, isDoctorsLoading, isSearching]);

  // Convert string coordinates to numbers for DoctorListSection
  const displayCoordinates = useMemo(() => {
    try {
      return {
        lat: parseFloat(searchCoordinates.lat) || LUXEMBOURG_COORDINATES.lat,
        lon: parseFloat(searchCoordinates.lon) || LUXEMBOURG_COORDINATES.lon
      };
    } catch (error) {
      console.error("Error parsing coordinates:", error);
      return {
        lat: LUXEMBOURG_COORDINATES.lat,
        lon: LUXEMBOURG_COORDINATES.lon
      };
    }
  }, [searchCoordinates]);

  const handleLocationToggle = useCallback((checked: boolean) => {
    if (!checked) {
      // When disabling location
      setUserLocation(LUXEMBOURG_COORDINATES);
      setIsUsingLocation(false);
      if (userProfile?.city) {
        handleCitySearch(userProfile.city);
      } else {
        handleCitySearch("Luxembourg City");
      }
    } else {
      // When enabling location
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
    }
    
    // Reset search radius
    if (radiusTimerRef.current) {
      clearTimeout(radiusTimerRef.current);
      radiusTimerRef.current = null;
    }
    
    setSearchRadius(2000);
    radiusUpdateAllowedRef.current = true;
    setMapError(null); // Reset any map errors when toggling location
  }, [handleCitySearch, setIsUsingLocation, setUserLocation, userProfile?.city]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="w-full max-w-6xl mx-auto">
            <SearchHeader onSearch={handleCitySearch} title="Find a Doctor Near You" />
            <div className="mb-4">
              <LocationToggle
                showDefaultLocation={isUsingLocation}
                onLocationToggle={handleLocationToggle}
              />
            </div>
            <div className="w-full mt-6">
              {isSearching ? (
                <div className="flex justify-center items-center h-64">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <DoctorListSection
                  doctors={doctors || []}
                  isLoading={isDoctorsLoading || isSearching}
                  coordinates={displayCoordinates}
                  showUserLocation={isUsingLocation}
                  onConnect={(doctorId, source) => {
                    try {
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
                    } catch (error) {
                      console.error("Error in onConnect handler:", error);
                    }
                  }}
                />
              )}
              
              {mapError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{mapError}</p>
                  <button 
                    className="mt-2 text-sm text-blue-600 hover:underline"
                    onClick={() => window.location.reload()}
                  >
                    Refresh page
                  </button>
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
