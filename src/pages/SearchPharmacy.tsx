
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchHeader from '@/components/pharmacy/SearchHeader';
import { usePharmacySearch } from '@/hooks/usePharmacySearch';
import PharmacyListSection from '@/components/pharmacy/PharmacyListSection';
import { PharmacyMap } from '@/components/pharmacy/map/PharmacyMap';
import PharmacySelection from '@/components/settings/pharmacy/PharmacySelection';
import { useAuth } from '@/hooks/auth/useAuth';

const SearchPharmacy = () => {
  const [search, setSearch] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const { coordinates } = useQuery({
    queryKey: ['geo-coordinates'],
    queryFn: async () => {
      // Default coordinates for Luxembourg
      return { lat: 49.8153, lon: 6.1296 };
    },
  }).data || { lat: 49.8153, lon: 6.1296 };
  
  const { pharmacies, isLoading } = usePharmacySearch(coordinates);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  
  const location = useLocation();
  const { profile } = useAuth();
  const locationState = location.state || {};
  const isPharmacistSignup = locationState.isNewSignup && locationState.userRole === 'pharmacist';
  const isPharmacist = profile?.role === 'pharmacist' || isPharmacistSignup;

  // Toggle map/list view
  const toggleView = () => {
    setIsMapView(prev => !prev);
  };

  // Handle search submission
  const searchPharmacy = (searchTerm: string) => {
    setSearch(searchTerm);
    // In a real implementation, this would filter pharmacies or trigger a new search
    console.log("Searching for pharmacies near:", searchTerm);
  };

  // Handle pharmacy selection
  const handleSelectPharmacy = (pharmacyId: string) => {
    setSelectedPharmacyId(pharmacyId);
  };

  // If this is a pharmacist during signup, show the pharmacy selection component
  if (isPharmacistSignup || isPharmacist) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">Select Your Pharmacy</h1>
          <PharmacySelection 
            userId={locationState.userId} 
            redirectAfterSelection={true}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Regular pharmacy search for patients
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
              coordinates={coordinates}
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
              coordinates={coordinates}
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
