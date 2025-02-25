
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SearchHeader } from '@/components/pharmacy/SearchHeader';
import { usePharmacySearch } from '@/hooks/usePharmacySearch';
import { PharmacyListSection } from '@/components/pharmacy/PharmacyListSection';
import PharmacyMap from '@/components/pharmacy/map/PharmacyMap';
import PharmacySelection from '@/components/settings/pharmacy/PharmacySelection';
import { useAuth } from '@/hooks/auth/useAuth';

const SearchPharmacy = () => {
  const { search, setSearch, searchPharmacy, pharmacies, isLoading, isMapView, toggleView } = usePharmacySearch();
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  
  const location = useLocation();
  const { profile } = useAuth();
  const locationState = location.state || {};
  const isPharmacistSignup = locationState.isNewSignup && locationState.userRole === 'pharmacist';
  const isPharmacist = profile?.role === 'pharmacist' || isPharmacistSignup;

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
          search={search}
          onSearchChange={setSearch}
          onSubmit={searchPharmacy}
          isLoading={isLoading}
          isMapView={isMapView}
          onToggleView={toggleView}
        />

        {isMapView ? (
          <PharmacyMap
            pharmacies={pharmacies}
            onSelectPharmacy={handleSelectPharmacy}
            selectedPharmacyId={selectedPharmacyId}
          />
        ) : (
          <div className="container mx-auto py-8 px-4">
            <PharmacyListSection
              pharmacies={pharmacies}
              isLoading={isLoading}
              onSelectPharmacy={handleSelectPharmacy}
              selectedPharmacyId={selectedPharmacyId}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SearchPharmacy;
