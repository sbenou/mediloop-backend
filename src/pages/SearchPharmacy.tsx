import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchHeader from '@/components/pharmacy/SearchHeader';
import { usePharmacySearch } from '@/hooks/usePharmacySearch';
import PharmacyListSection from '@/components/pharmacy/PharmacyListSection';
import PharmacySelection from '@/components/settings/pharmacy/PharmacySelection';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import SimplePharmacyMap from '@/components/pharmacy/SimplePharmacyMap';

const SearchPharmacy = () => {
  const [search, setSearch] = useState('');
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
  const [filteredPharmacies, setFilteredPharmacies] = useState<any[]>([]);
  
  const location = useLocation();
  const { profile } = useAuth();
  const locationState = location.state || {};
  const isPharmacistSignup = locationState.isNewSignup && locationState.userRole === 'pharmacist';
  const isPharmacist = profile?.role === 'pharmacist' || isPharmacistSignup;

  // Move pharmacyAssignment query before it's used in the useEffect
  const { data: pharmacyAssignment, isLoading: checkingPharmacy } = useQuery({
    queryKey: ['pharmacistPharmacy', profile?.id],
    enabled: !!profile?.id && profile?.role === 'pharmacist',
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('user_pharmacies')
          .select('pharmacy_id')
          .eq('user_id', profile?.id)
          .maybeSingle();
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Error fetching pharmacy assignment:", err);
        return null;
      }
    },
  });

  useEffect(() => {
    try {
      if (profile?.role === 'pharmacist' && pharmacyAssignment?.pharmacy_id && locationState.fromOnboarding) {
        navigate('/pharmacy/profile');
      }
    } catch (err) {
      console.error("Error in pharmacist navigation effect:", err);
    }
  }, [profile, pharmacyAssignment, navigate, locationState]);

  useEffect(() => {
    // Initialize with Luxembourg City as default
    if (!locationCoordinates) {
      try {
        handleCitySearch("Luxembourg City");
      } catch (err) {
        console.error("Error searching for Luxembourg City:", err);
      }
    }
  }, []);

  useEffect(() => {
    // Set filtered pharmacies when data loads
    if (pharmacies && pharmacies.length > 0) {
      setFilteredPharmacies(pharmacies);
    }
  }, [pharmacies]);

  const searchPharmacy = (searchTerm: string) => {
    try {
      setSearch(searchTerm);
      handleCitySearch(searchTerm);
      console.log("Searching for pharmacies near:", searchTerm);
    } catch (err) {
      console.error("Error searching for pharmacy:", err);
    }
  };

  const handleSelectPharmacy = (pharmacyId: string) => {
    try {
      setSelectedPharmacyId(pharmacyId);
    } catch (err) {
      console.error("Error selecting pharmacy:", err);
    }
  };

  const handlePharmacySelectionComplete = () => {
    try {
      toast({
        title: "Pharmacy Selection Complete",
        description: "You can now access your pharmacy profile.",
      });
      navigate('/pharmacy/profile');
    } catch (err) {
      console.error("Error completing pharmacy selection:", err);
    }
  };

  // Handler for updating filtered pharmacies
  const handlePharmaciesInShape = (filteredPharmacies: any[]) => {
    // We're keeping this function but using it just to log
    console.log(`Map has updated with ${filteredPharmacies.length} pharmacies in view`);
  };

  // Special case for pharmacists who need to select their pharmacy
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
      <main className="flex-1 w-full">
        <SearchHeader
          onSearch={searchPharmacy}
          title="Find a Pharmacy Near You"
        />

        <div className="container mx-auto py-8 px-4">
          <div className="w-full max-w-6xl mx-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading pharmacies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
                {/* Pharmacy List */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  {filteredPharmacies.length === 0 ? (
                    <p className="text-center py-8">No pharmacies found</p>
                  ) : (
                    filteredPharmacies.map((pharmacy) => (
                      <Card key={pharmacy.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
                            <p className="text-sm text-gray-500">{pharmacy.address}</p>
                            {pharmacy.phone && (
                              <p className="text-sm">📞 {pharmacy.phone}</p>
                            )}
                            {pharmacy.email && (
                              <p className="text-sm">✉️ {pharmacy.email}</p>
                            )}
                            {pharmacy.hours && (
                              <p className="text-sm">⏰ {pharmacy.hours}</p>
                            )}
                            {pharmacy.distance && (
                              <p className="text-sm font-medium">📍 {pharmacy.distance} km</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                
                {/* Map */}
                <div className="h-full">
                  <SimplePharmacyMap
                    pharmacies={filteredPharmacies}
                    userLocation={currentCoordinates}
                    height="calc(100vh - 220px)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPharmacy;
