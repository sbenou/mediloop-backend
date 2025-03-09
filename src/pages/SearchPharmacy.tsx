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

const SearchPharmacy = () => {
  const [search, setSearch] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const navigate = useNavigate();
  
  const { data: coordinates } = useQuery({
    queryKey: ['geo-coordinates'],
    queryFn: async () => {
      return { lat: 49.8153, lon: 6.1296 };
    },
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

  const toggleView = () => {
    setIsMapView(prev => !prev);
  };

  const searchPharmacy = (searchTerm: string) => {
    setSearch(searchTerm);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <SearchHeader
          onSearch={searchPharmacy}
          title="Find a Pharmacy Near You"
        />

        {isMapView ? (
          <div className="container mx-auto py-8 px-4">
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
              pharmacies={pharmacies}
              filteredPharmacies={pharmacies}
              onPharmaciesInShape={() => {}}
              showDefaultLocation={false}
            />
          </div>
        ) : (
          <div className="container mx-auto py-8 px-4">
            <div className="flex justify-end mb-4">
              <button 
                onClick={toggleView}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Switch to Map View
              </button>
            </div>
            <PharmacyListSection
              pharmacies={pharmacies}
              isLoading={isLoading}
              coordinates={currentCoordinates}
              defaultPharmacyId={null}
              onPharmacySelect={handleSelectPharmacy}
              onSetDefaultPharmacy={() => {}}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchPharmacy;
