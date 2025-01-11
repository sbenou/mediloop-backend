import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { usePharmacySearch } from "@/hooks/usePharmacySearch";
import { usePharmacyState, LUXEMBOURG_COORDINATES } from "@/hooks/usePharmacyState";
import Header from "@/components/layout/Header";
import SearchHeader from "@/components/pharmacy/SearchHeader";
import PharmacyListSection from "@/components/pharmacy/PharmacyListSection";
import { toast } from "@/components/ui/use-toast";

const SearchPharmacy = () => {
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
    defaultPharmacy,
    handlePharmacySelect,
    handleSetDefaultPharmacy
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
            description: "Showing pharmacies in Luxembourg City. You can search for a specific location.",
          });
          
          handleCitySearch("Luxembourg City");
        }
      );
    }
  }, [session, coordinates]);

  const searchCoordinates = coordinates 
    ? { 
        lat: parseFloat(coordinates.lat), 
        lon: parseFloat(coordinates.lon) 
      } 
    : userLocation || LUXEMBOURG_COORDINATES;

  const { pharmacies, isLoading } = usePharmacySearch(
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
    if (session && pharmacies.length === 0 && searchRadius < 10000) {
      setSearchRadius(prev => Math.min(prev + 2000, 10000));
    }
  }, [pharmacies.length, searchRadius, session]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-4">
        <SearchHeader onSearch={handleCitySearch} />
        <PharmacyListSection
          pharmacies={pharmacies}
          isLoading={isLoading || isSearching}
          coordinates={searchCoordinates}
          defaultPharmacyId={defaultPharmacy}
          onPharmacySelect={handlePharmacySelect}
          onSetDefaultPharmacy={handleSetDefaultPharmacy}
        />
      </main>
    </div>
  );
};

export default SearchPharmacy;