
import { useEffect, useState } from "react";
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
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const [isUsingLocation, setIsUsingLocation] = useRecoilState(isUsingLocationState);
  const { userProfile } = usePharmacyState(session);
  const [mapError, setMapError] = useState<string | null>(null);

  const { coordinates, searchRadius, setSearchRadius, handleCitySearch, isSearching } = useLocationSearch();

  const searchCoordinates = coordinates 
    ? { 
        lat: coordinates.lat, 
        lon: coordinates.lon 
      } 
    : userLocation 
      ? {
          lat: userLocation.lat.toString(),
          lon: userLocation.lon.toString()
        }
      : {
          lat: LUXEMBOURG_COORDINATES.lat.toString(),
          lon: LUXEMBOURG_COORDINATES.lon.toString()
        };

  const { doctors, isLoading: isDoctorsLoading } = useDoctorSearch(searchCoordinates, searchRadius);

  useEffect(() => {
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
      }
    } catch (error) {
      console.error("Error in session effect:", error);
    }
  }, [session, coordinates, userProfile?.city]);

  useEffect(() => {
    try {
      if (Array.isArray(doctors) && doctors.length === 0 && searchRadius < 10000) {
        console.log('No doctors found, increasing search radius');
        setSearchRadius(prev => Math.min(prev + 2000, 10000));
      }
    } catch (error) {
      console.error("Error in doctors effect:", error);
    }
  }, [doctors, searchRadius]);

  // Convert string coordinates to numbers for DoctorListSection
  const displayCoordinates = {
    lat: parseFloat(searchCoordinates.lat),
    lon: parseFloat(searchCoordinates.lon)
  };

  // Add fallback values in case parsing fails
  if (isNaN(displayCoordinates.lat)) displayCoordinates.lat = 49.8153;
  if (isNaN(displayCoordinates.lon)) displayCoordinates.lon = 6.1296;

  const handleLocationToggle = (checked: boolean) => {
    try {
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
      setSearchRadius(2000);
      setMapError(null); // Reset any map errors when toggling location
    } catch (err) {
      console.error("Error toggling location:", err);
      setMapError("Error accessing location services");
    }
  };

  // Error handler for the map
  const handleMapError = (error: Error) => {
    console.error("Map error:", error);
    setMapError("Failed to load map properly. Please try refreshing.");
  };

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
                  doctors={doctors}
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
