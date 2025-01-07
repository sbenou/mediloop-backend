import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CitySearch from '@/components/CitySearch';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { searchPharmacies } from '@/lib/overpass';
import { supabase } from '@/lib/supabase';
import EmailConfirmationHandler from '@/components/auth/EmailConfirmationHandler';
import Header from '@/components/layout/Header';
import PharmacyListSection from '@/components/pharmacy/PharmacyListSection';

// Luxembourg City coordinates
const DEFAULT_COORDINATES = { lat: 49.6116, lon: 6.1319 };

const Index = () => {
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(DEFAULT_COORDINATES);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [defaultPharmacyId, setDefaultPharmacyId] = useState<string | null>(null);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: userAddress } = useQuery({
    queryKey: ['userAddress'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_default', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (userAddress?.city) {
      handleSearch(userAddress.city);
    }
  }, [userAddress]);

  const { data: pharmacies, isLoading, refetch } = useQuery({
    queryKey: ['pharmacies', coordinates, searchRadius],
    queryFn: async () => {
      if (!coordinates) return [];
      const results = await searchPharmacies(coordinates.lat, coordinates.lon, searchRadius);
      
      if (results.length === 0 && searchRadius < 10000) {
        setSearchRadius(prev => Math.min(prev * 2, 10000));
        return [];
      }

      return results.map(pharmacy => ({
        ...pharmacy,
        id: pharmacy.id.toString(),
        email: null,
      }));
    },
    enabled: !!coordinates,
  });

  const handleSearch = async (city: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        });
        setSearchRadius(2000);
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find coordinates for the specified city.",
        });
      }
    } catch (error: any) {
      console.error('Error searching city:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search location. Please try again.",
      });
    }
  };

  const handlePharmacySelect = (pharmacyId: string) => {
    navigate(`/products/${pharmacyId}`);
  };

  const handleSetDefaultPharmacy = (pharmacyId: string, isDefault: boolean) => {
    if (isDefault) {
      setDefaultPharmacyId(pharmacyId);
      const pharmacy = pharmacies?.find(p => p.id === pharmacyId);
      if (pharmacy) {
        toast({
          title: "Default Pharmacy Set",
          description: `${pharmacy.name} has been set as your default pharmacy.`,
        });
      }
    } else {
      setDefaultPharmacyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmailConfirmationHandler />
      <Header session={session} />

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Nearby Pharmacies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search for pharmacies in your area
          </p>
        </div>

        <div className="mb-12 animate-slide-up">
          <CitySearch onSearch={handleSearch} />
        </div>

        <PharmacyListSection 
          pharmacies={pharmacies || []}
          isLoading={isLoading}
          coordinates={coordinates}
          defaultPharmacyId={defaultPharmacyId}
          onPharmacySelect={handlePharmacySelect}
          onSetDefaultPharmacy={handleSetDefaultPharmacy}
        />
      </div>
    </div>
  );
};

export default Index;