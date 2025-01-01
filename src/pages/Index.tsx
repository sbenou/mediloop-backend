import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CitySearch from '@/components/CitySearch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import UserMenu from '@/components/UserMenu';
import { useQuery } from '@tanstack/react-query';
import { searchPharmacies } from '@/lib/overpass';

const Index = () => {
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ['pharmacies', coordinates],
    queryFn: async () => {
      if (!coordinates) return [];
      return searchPharmacies(coordinates.lat, coordinates.lon);
    },
    enabled: !!coordinates,
  });

  const handleSearch = async (city: string) => {
    try {
      // First get coordinates from the city name using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        });
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find coordinates for the specified city.",
        });
      }
    } catch (error) {
      console.error('Error searching city:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for pharmacies. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <UserMenu />
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
            Search for pharmacies in your area and upload your prescription for delivery
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
            <Card key={pharmacy.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
                    <p className="text-sm text-gray-500">{pharmacy.address}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">{pharmacy.hours}</p>
                    <p className="text-sm text-gray-500">{pharmacy.phone}</p>
                    <p className="text-sm font-medium text-primary">{pharmacy.distance}</p>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Pharmacy Selected",
                        description: `You've selected ${pharmacy.name} as your pharmacy.`,
                      });
                    }}
                  >
                    Select Pharmacy
                  </Button>
                </div>
              </CardContent>
            </Card>
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