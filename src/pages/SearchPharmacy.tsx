
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchHeader from '@/components/pharmacy/SearchHeader';
import { usePharmacySearch } from '@/hooks/usePharmacySearch';
import PharmacyListSection from '@/components/pharmacy/PharmacyListSection';
import { PharmacyMap } from '@/components/pharmacy/map/PharmacyMap';
import PharmacySelection from '@/components/settings/pharmacy/PharmacySelection';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocationSearch } from "@/hooks/useLocationSearch";

const SearchPharmacy = () => {
  const [search, setSearch] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const navigate = useNavigate();
  
  const { coordinates: locationCoordinates, handleCitySearch } = useLocationSearch();
  
  // Get default Luxembourg coordinates if location search hasn't provided any
  const { data: coordinates } = useQuery({
    queryKey: ['geo-coordinates'],
    queryFn: async () => {
      return locationCoordinates ? 
        { lat: parseFloat(locationCoordinates.lat), lon: parseFloat(locationCoordinates.lon) } : 
        { lat: 49.8153, lon: 6.1296 };
    },
    enabled: true,
  });
  
  const currentCoordinates = coordinates || { lat: 49.8153, lon: 6.1296 };
  
  const { pharmacies, isLoading } = usePharmacySearch(currentCoordinates);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  
  const location = useLocation();
  const { profile } = useAuth();
  const locationState = location.state || {};
  const isPharmacistSignup = locationState.isNewSignup && locationState.userRole === 'pharmacist';
  const isPharmacist = profile?.role === 'pharmacist' || isPharmacistSignup;

  const { data: pharmacyAssignment, isLoading: checkingPharmacy } = useQuery({
    queryKey: ['pharmacistPharmacy', profile?.id],
    enabled: !!profile?.id && profile?.role === 'pharmacist',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_pharmacies')
        .select('pharmacy_id')
        .eq('user_id', profile?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.role === 'pharmacist' && pharmacyAssignment?.pharmacy_id) {
      navigate('/pharmacy/profile');
    }
  }, [profile, pharmacyAssignment, navigate]);

  useEffect(() => {
    // Initialize with Luxembourg City as default
    if (!locationCoordinates) {
      handleCitySearch("Luxembourg City");
    }
  }, []);

  console.log("SearchPharmacy rendering with coordinates:", currentCoordinates);
  console.log("Pharmacies found:", pharmacies?.length);

  const toggleView = () => {
    setIsMapView(prev => !prev);
  };

  const searchPharmacy = (searchTerm: string) => {
    setSearch(searchTerm);
    handleCitySearch(searchTerm);
    console.log("Searching for pharmacies near:", searchTerm);
  };

  const handleSelectPharmacy = (pharmacyId: string) => {
    setSelectedPharmacyId(pharmacyId);
  };

  const handlePharmacySelectionComplete = () => {
    toast({
      title: "Pharmacy Selection Complete",
      description: "You can now access your pharmacy profile.",
    });
    navigate('/pharmacy/profile');
  };

  if (isPharmacist && (!pharmacyAssignment?.pharmacy_id || isPharmacistSignup)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">Select Your Pharmacy</h1>
          <Card>
            <CardHeader>
              <CardTitle>Pharmacy Selection</CardTitle>
              <CardDescription>
                As a pharmacist, please select the pharmacy you work at
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PharmacySelection 
                userId={locationState.userId || profile?.id} 
                redirectAfterSelection={true}
                onComplete={handlePharmacySelectionComplete}
              />
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // For patients or non-authenticated users, show the pharmacy search view
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <SearchHeader
          onSearch={searchPharmacy}
          title="Find a Pharmacy Near You"
        />

        <div className="container mx-auto py-8 px-4">
          {isMapView ? (
            <div className="w-full h-[calc(100vh-300px)]">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={toggleView}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Switch to List View
                </button>
              </div>
              <PharmacyMap
                coordinates={currentCoordinates}
                pharmacies={pharmacies || []}
                filteredPharmacies={pharmacies || []}
                onPharmaciesInShape={() => {}}
                showDefaultLocation={false}
              />
            </div>
          ) : (
            <div className="w-full">
              <div className="flex justify-end mb-4">
                <button 
                  onClick={toggleView}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Switch to Map View
                </button>
              </div>
              {pharmacies ? (
                <div className="w-full h-full">
                  <PharmacyListSection
                    pharmacies={pharmacies}
                    isLoading={isLoading}
                    coordinates={currentCoordinates}
                    defaultPharmacyId={null}
                    onPharmacySelect={handleSelectPharmacy}
                    onSetDefaultPharmacy={() => {}}
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">Loading pharmacies...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPharmacy;
