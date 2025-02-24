
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useDoctorSearch } from "@/hooks/useDoctorSearch";
import { usePharmacyState, LUXEMBOURG_COORDINATES } from "@/hooks/usePharmacyState";
import Header from "@/components/layout/Header";
import SearchHeader from "@/components/pharmacy/SearchHeader";
import DoctorListSection from "@/components/doctor/DoctorListSection";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { LocationToggle } from "@/components/shared/LocationToggle";

const DoctorSearch = () => {
  const { isAuthenticated } = useAuth();
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    userLocation,
    setUserLocation,
    userProfile,
  } = usePharmacyState(session);

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

  // Effect to initialize location
  useEffect(() => {
    if (!coordinates && !userLocation) {
      if (session && userProfile?.city) {
        handleCitySearch(userProfile.city);
      } else {
        handleCitySearch("Luxembourg City");
      }
    }
  }, [session, coordinates, userProfile?.city]);

  // Effect for search radius adjustment
  useEffect(() => {
    if (doctors?.length === 0 && searchRadius < 10000) {
      setSearchRadius(prev => Math.min(prev + 2000, 10000));
    }
  }, [doctors?.length, searchRadius]);

  const handleLocationToggle = (checked: boolean) => {
    if (checked) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            setSearchRadius(2000);
            toast({
              title: "Using your location",
              description: "Showing doctors within 2km of your location",
            });
          },
          () => {
            toast({
              title: "Location access denied",
              description: "Please enable location access or search for a specific city.",
              variant: "destructive",
            });
          }
        );
      }
    } else {
      if (userProfile?.city) {
        handleCitySearch(userProfile.city);
      } else {
        setUserLocation(null);
        handleCitySearch("Luxembourg City");
      }
      setSearchRadius(2000);
    }
  };

  const displayCoordinates = {
    lat: parseFloat(searchCoordinates.lat),
    lon: parseFloat(searchCoordinates.lon)
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4">
        <SearchHeader onSearch={handleCitySearch} title="Find a Doctor Near You" />
        <LocationToggle
          showDefaultLocation={false}
          onLocationToggle={handleLocationToggle}
        />
        <DoctorListSection
          doctors={doctors}
          isLoading={isDoctorsLoading || isSearching}
          coordinates={displayCoordinates}
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
      </main>
    </div>
  );
};

export default DoctorSearch;
