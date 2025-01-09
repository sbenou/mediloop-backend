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

const DoctorSearch = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const {
    userLocation,
    setUserLocation,
    userProfile,
  } = usePharmacyState(session);

  const { coordinates, searchRadius, setSearchRadius, handleCitySearch, isSearching } = useLocationSearch();

  useEffect(() => {
    if (!session && !coordinates && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          setUserLocation(LUXEMBOURG_COORDINATES);
          toast({
            title: "Using Default Location",
            description: "Showing doctors in Luxembourg City. You can search for a specific location.",
          });
          
          handleCitySearch("Luxembourg City");
        }
      );
    }
  }, [session, coordinates]);

  const searchCoordinates = coordinates 
    ? { 
        lat: coordinates.lat.toString(), 
        lon: coordinates.lon.toString() 
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

  const { doctors, isLoading } = useDoctorSearch(
    searchCoordinates,
    searchRadius
  );

  useEffect(() => {
    if (!session && !coordinates) {
      handleCitySearch("Luxembourg City");
    } else if (session && userProfile?.city) {
      handleCitySearch(userProfile.city);
    }
  }, [session, userProfile?.city]);

  useEffect(() => {
    if (session && doctors?.length === 0 && searchRadius < 10000) {
      setSearchRadius(prev => Math.min(prev + 2000, 10000));
    }
  }, [doctors?.length, searchRadius, session]);

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} />
      <main className="container mx-auto p-4">
        <SearchHeader onSearch={handleCitySearch} />
        <DoctorListSection
          doctors={doctors}
          isLoading={isLoading || isSearching}
          coordinates={searchCoordinates}
          onConnect={(doctorId, source) => {
            if (!session) {
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