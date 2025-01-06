import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CitySearch from '@/components/CitySearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import UserMenu from '@/components/UserMenu';
import { useQuery } from '@tanstack/react-query';
import { searchPharmacies } from '@/lib/overpass';
import PharmacyCard from '@/components/PharmacyCard';
import { supabase } from '@/lib/supabase';
import EmailConfirmationHandler from '@/components/auth/EmailConfirmationHandler';

const Index = () => {
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [defaultPharmacyId, setDefaultPharmacyId] = useState<string | null>(null);

  // Check if user is logged in
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Fetch user's address
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

  // Auto-search based on user's address
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
        setSearchRadius(2000); // Reset radius on new search
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find coordinates for the specified city.",
        });
      }
    } catch (error: any) {
      console.error('Error searching city:', error);
      
      let errorMessage = "Failed to search for location. ";
      if (error.name === 'AbortError') {
        errorMessage = "The search request timed out. Please try again.";
      } else if (!navigator.onLine) {
        errorMessage += "Please check your internet connection.";
      } else {
        errorMessage += "Please try again in a few moments.";
      }

      toast({
        variant: "destructive",
        title: "Search Error",
        description: errorMessage,
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {session ? (
                <UserMenu />
              ) : (
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Connection
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

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

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pharmacies?.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy.id}
              {...pharmacy}
              onSelect={handlePharmacySelect}
              onSetDefault={handleSetDefaultPharmacy}
              isDefault={defaultPharmacyId === pharmacy.id}
            />
          ))}
        </div>

        {pharmacies?.length === 0 && coordinates && !isLoading && (
          <p className="text-center text-gray-500">No pharmacies found in this area</p>
        )}
      </div>
    </div>
  );
};

export default Index;
