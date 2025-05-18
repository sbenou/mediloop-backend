
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import StaticMapComponent from './StaticMapComponent';

interface PharmacyFinderMapProps {
  pharmacies: any[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
}

export function PharmacyFinderMap({ 
  pharmacies, 
  userLocation, 
  useLocationFilter 
}: PharmacyFinderMapProps) {
  const [filteredPharmacies, setFilteredPharmacies] = useState<any[]>([]);
  
  // Initialize with all pharmacies
  useEffect(() => {
    console.log('PharmacyFinderMap: Setting filtered pharmacies', pharmacies.length);
    setFilteredPharmacies(pharmacies);
  }, [pharmacies]);
  
  // Handle pharmacies filtered by the map
  const handlePharmaciesInShape = useCallback((inShapePharmacies: any[]) => {
    console.log(`Map filtered ${inShapePharmacies.length} pharmacies`);
    // Update filtered pharmacies
    setFilteredPharmacies(inShapePharmacies);
  }, []);
  
  if (!userLocation) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Loading location data...</p>
      </Card>
    );
  }

  return (
    <div className="w-full h-full">
      <StaticMapComponent
        pharmacies={pharmacies}
        userLocation={useLocationFilter ? userLocation : null}
        onPharmaciesInShape={handlePharmaciesInShape}
      />
    </div>
  );
}
