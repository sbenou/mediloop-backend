
import { useEffect } from "react";
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
    if (!session) {
      setUserLocation(LUXEMBOURG_COORDINATES);
      setIsUsingLocation(false);
      if (!coordinates) {
        handleCitySearch("Luxembourg City");
      }
    } else if (!coordinates && userProfile?.city) {
      handleCitySearch(userProfile.city);
    }
  }, [session, coordinates, userProfile?.city]);

  useEffect(() => {
    if (doctors?.length === 0 && searchRadius < 10000) {
      setSearchRadius(prev => Math.min(prev + 2000, 10000));
    }
  }, [doctors?.length, searchRadius]);

  // Convert string coordinates to numbers for DoctorListSection
  const displayCoordinates = {
    lat: parseFloat(searchCoordinates.lat),
    lon: parseFloat(searchCoordinates.lon)
  };

  console.log("FindDoctor rendering with coordinates:", displayCoordinates);
  console.log("Doctors found:", doctors?.length);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4">
        <div className="w-full max-w-6xl mx-auto">
          <SearchHeader onSearch={handleCitySearch} title="Find a Doctor Near You" />
          <div className="mb-4">
            <LocationToggle
              showDefaultLocation={isUsingLocation}
              onLocationToggle={(checked) => {
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
                } catch (err) {
                  console.error("Error toggling location:", err);
                }
              }}
            />
          </div>
          <div className="w-full h-full mt-6">
            {doctors ? (
              <DoctorListSection
                doctors={doctors}
                isLoading={isDoctorsLoading || isSearching}
                coordinates={displayCoordinates}
                showUserLocation={isUsingLocation}
                onConnect={(doctorId, source) => {
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
                }}
              />
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading doctors...</p>
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
