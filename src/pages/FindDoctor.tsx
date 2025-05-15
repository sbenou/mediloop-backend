
import { useEffect, useState, useCallback, useRef } from "react";
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
  
  const [searchRadius, setSearchRadius] = useState(2000);
  const [initialLocationSet, setInitialLocationSet] = useState(false);

  const { coordinates, handleCitySearch, isSearching } = useLocationSearch();

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

  const { doctors, isLoading: isDoctorsLoading } = useDoctorSearch(searchCoordinates, searchRadius);
  
  // Initialize location based on session/profile
  useEffect(() => {
    if (initialLocationSet) {
      return; // Don't re-initialize if already done
    }

    try {
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
  }, [session, coordinates, userProfile?.city, setUserLocation, setIsUsingLocation, handleCitySearch, initialLocationSet]);

  // Increase search radius when no doctors found
  useEffect(() => {
    // Check if no doctors found and we haven't reached max radius
    if (
      Array.isArray(doctors) && 
      doctors.length === 0 && 
      searchRadius < 10000 &&
      !isSearching && 
      !isDoctorsLoading
    ) {
      const newRadius = Math.min(searchRadius + 2000, 10000);
      console.log(`Increasing radius from ${searchRadius} to ${newRadius}`);
      setSearchRadius(newRadius);
    }
  }, [doctors, searchRadius, isDoctorsLoading, isSearching]);

  // Handle location toggle
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
    setSearchRadius(2000);
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
                  isLoading={isDoctorsLoading}
                  coordinates={searchCoordinates}
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FindDoctor;
