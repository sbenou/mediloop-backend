
import { useEffect, useState } from "react";
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
  const [showDefaultLocation, setShowDefaultLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);
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

  // Check for location permission on component mount
  useEffect(() => {
    const checkPermission = async () => {
      if ("permissions" in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setHasLocationPermission(result.state === 'granted');
          
          result.addEventListener('change', () => {
            setHasLocationPermission(result.state === 'granted');
          });
        } catch (error) {
          console.log('Permission check error:', error);
          setHasLocationPermission(null); // Reset to null on error
        }
      }
    };
    
    checkPermission();
  }, []);

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

  const handleLocationToggle = (checked: boolean) => {
    setShowDefaultLocation(checked);
    if (checked) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
            setSearchRadius(2000);
            setHasLocationPermission(true);
            toast({
              title: "Using your location",
              description: "Showing doctors within 2km of your location",
            });
          },
          (error) => {
            console.log('Geolocation error:', error);
            setShowDefaultLocation(false);
            setHasLocationPermission(false);
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
          showDefaultLocation={showDefaultLocation}
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
