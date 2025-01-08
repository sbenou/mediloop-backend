import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { usePharmacySearch } from "@/hooks/usePharmacySearch";
import Header from "@/components/layout/Header";
import CitySearch from "@/components/CitySearch";
import PharmacyListSection from "@/components/pharmacy/PharmacyListSection";
import { toast } from "@/components/ui/use-toast";

const LUXEMBOURG_COORDINATES = {
  lat: 49.6116,
  lon: 6.1319
};

const SearchPharmacy = () => {
  const { coordinates, searchRadius, setSearchRadius, handleCitySearch, isSearching } = useLocationSearch();
  
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { pharmacies, isLoading } = usePharmacySearch(
    coordinates ? { lat: parseFloat(coordinates.lat), lon: parseFloat(coordinates.lon) } : LUXEMBOURG_COORDINATES,
    searchRadius
  );

  const { data: defaultPharmacy } = useQuery({
    queryKey: ['defaultPharmacy', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', session.user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data?.pharmacy_id || null;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (!session && !coordinates) {
      // For non-logged in users, show all pharmacies in Luxembourg City by default
      handleCitySearch("Luxembourg City");
    } else if (session && userProfile?.city) {
      // For logged-in users, show nearby pharmacies based on their city
      handleCitySearch(userProfile.city);
    }
  }, [session, userProfile?.city]);

  useEffect(() => {
    if (session && pharmacies.length === 0 && searchRadius < 10000) {
      // Increase search radius if no pharmacies found (for logged-in users)
      setSearchRadius(prev => Math.min(prev + 2000, 10000));
    }
  }, [pharmacies.length, searchRadius, session]);

  const handlePharmacySelect = async (pharmacyId: string) => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to order from this pharmacy.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `/products/${pharmacyId}`;
  };

  const handleSetDefaultPharmacy = async (pharmacyId: string, isDefault: boolean) => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to set a default pharmacy.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isDefault) {
        await supabase
          .from('user_pharmacies')
          .upsert({ user_id: session.user.id, pharmacy_id: pharmacyId });
        
        toast({
          title: "Success",
          description: "Default pharmacy has been set.",
        });
      } else {
        await supabase
          .from('user_pharmacies')
          .delete()
          .eq('user_id', session.user.id)
          .eq('pharmacy_id', pharmacyId);
          
        toast({
          title: "Success",
          description: "Default pharmacy has been removed.",
        });
      }
    } catch (error) {
      console.error('Error setting default pharmacy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update default pharmacy. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Find a Pharmacy Near You</h1>
          <div className="mb-8">
            <CitySearch onSearch={handleCitySearch} />
          </div>
          <PharmacyListSection
            pharmacies={pharmacies}
            isLoading={isLoading || isSearching}
            coordinates={coordinates || LUXEMBOURG_COORDINATES}
            defaultPharmacyId={defaultPharmacy}
            onPharmacySelect={handlePharmacySelect}
            onSetDefaultPharmacy={handleSetDefaultPharmacy}
          />
        </div>
      </main>
    </div>
  );
};

export default SearchPharmacy;