
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { usePharmacySearch } from "@/hooks/usePharmacySearch";
import { usePharmacyState, LUXEMBOURG_COORDINATES } from "@/hooks/usePharmacyState";
import Header from "@/components/layout/Header";
import SearchHeader from "@/components/pharmacy/SearchHeader";
import PharmacyListSection from "@/components/pharmacy/PharmacyListSection";

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
    // Set Luxembourg coordinates by default without showing the toast
    setUserLocation(LUXEMBOURG_COORDINATES);
    
    // Only attempt geolocation if coordinates aren't set
    if (!coordinates && "geolocation" in navigator) {
      handleCitySearch("Luxembourg City");
    }
  }, [coordinates]);

  const searchCoordinates = coordinates 
    ? { 
        lat: parseFloat(coordinates.lat), 
        lon: parseFloat(coordinates.lon) 
      } 
    : userLocation || LUXEMBOURG_COORDINATES;

  const { pharmacies, isLoading } = usePharmacySearch(
    searchCoordinates,
    10000 // Increased search radius to cover all of Luxembourg
  );

  useEffect(() => {
    if (!coordinates && session && userProfile?.city) {
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
