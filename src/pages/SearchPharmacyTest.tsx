
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, Search } from 'lucide-react';
import { useLocationDetection } from '@/hooks/useLocationDetection';

// Mock pharmacy data for testing
const mockPharmacies = [
  {
    id: '1',
    name: 'Pharmacie de la Gare',
    address: '12 Avenue de la Gare',
    city: 'Luxembourg',
    postal_code: '1234',
    phone: '+352 123 456',
    hours: 'Mon-Fri: 8:00-18:00, Sat: 9:00-17:00',
    endorsed: true,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Pharmacie Centrale',
    address: '25 Boulevard Royal',
    city: 'Luxembourg',
    postal_code: '2345',
    phone: '+352 234 567',
    hours: 'Mon-Fri: 8:30-19:00, Sat: 9:00-18:00',
    endorsed: false,
    created_at: '2024-01-01T00:00:00Z'
  }
];

interface PharmacyWithLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  hours: string;
  endorsed: boolean;
  created_at: string;
  coordinates?: [number, number];
  distance?: number;
}

const SearchPharmacyTest: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pharmacies, setPharmacies] = useState<PharmacyWithLocation[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<PharmacyWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userLocation, isLoading: locationLoading, error: locationError } = useLocationDetection();

  useEffect(() => {
    // Initialize with mock data
    const pharmaciesWithMockCoordinates = mockPharmacies.map(pharmacy => ({
      ...pharmacy,
      coordinates: [49.6116 + Math.random() * 0.01, 6.1319 + Math.random() * 0.01] as [number, number]
    }));
    
    setPharmacies(pharmaciesWithMockCoordinates);
    setFilteredPharmacies(pharmaciesWithMockCoordinates);
  }, []);

  useEffect(() => {
    // Filter pharmacies based on search term
    if (!searchTerm.trim()) {
      setFilteredPharmacies(pharmacies);
      return;
    }

    const filtered = pharmacies.filter(pharmacy =>
      pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pharmacy.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPharmacies(filtered);
  }, [searchTerm, pharmacies]);

  useEffect(() => {
    // Calculate distances when user location is available
    if (userLocation && pharmacies.length > 0) {
      const pharmaciesWithDistance = pharmacies.map(pharmacy => {
        if (pharmacy.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lon,
            pharmacy.coordinates[0],
            pharmacy.coordinates[1]
          );
          return { ...pharmacy, distance };
        }
        return pharmacy;
      });

      // Sort by distance
      pharmaciesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setPharmacies(pharmaciesWithDistance);
      setFilteredPharmacies(pharmaciesWithDistance);
    }
  }, [userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const handleSearch = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Pharmacy Search Test
        </h1>

        {/* Location Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationLoading && (
              <p className="text-gray-600">Detecting your location...</p>
            )}
            {locationError && (
              <p className="text-red-600">Location error: {locationError.message}</p>
            )}
            {userLocation && (
              <p className="text-green-600">
                Location detected: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
              </p>
            )}
            {!locationLoading && !locationError && !userLocation && (
              <p className="text-gray-600">Location not available</p>
            )}
          </CardContent>
        </Card>

        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search pharmacies by name, address, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {filteredPharmacies.length} pharmacy(ies) found
          </h2>

          {filteredPharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      {pharmacy.name}
                      {pharmacy.endorsed && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Endorsed
                        </Badge>
                      )}
                    </h3>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {pharmacy.address}, {pharmacy.city} {pharmacy.postal_code}
                      </p>
                      {pharmacy.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {pharmacy.phone}
                        </p>
                      )}
                      {pharmacy.hours && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {pharmacy.hours}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {pharmacy.distance !== undefined && (
                      <Badge variant="outline">
                        {pharmacy.distance.toFixed(1)} km
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="default" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPharmacies.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No pharmacies found matching your search.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPharmacyTest;
