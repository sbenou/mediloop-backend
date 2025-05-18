
import { useState, useEffect, useCallback } from 'react';
import { PharmacyMap } from '../map/PharmacyMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
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
  const [useStaticMap, setUseStaticMap] = useState(false);
  
  // Initialize with all pharmacies
  useEffect(() => {
    console.log('PharmacyFinderMap: Setting filtered pharmacies', pharmacies.length);
    setFilteredPharmacies(pharmacies);
  }, [pharmacies]);
  
  // Handle pharmacies that are filtered by the map (when drawing shapes)
  const handlePharmaciesInShape = useCallback((inShapePharmacies: any[]) => {
    console.log(`Map filtered ${inShapePharmacies.length} pharmacies`);
    // Update filtered pharmacies
    setFilteredPharmacies(inShapePharmacies);
  }, []);
  
  // If there's an error with the interactive map, fall back to static map
  const handleMapError = useCallback(() => {
    console.log('Falling back to static map due to errors');
    setUseStaticMap(true);
  }, []);
  
  if (!userLocation) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  return (
    <div className="w-full h-full">
      {useStaticMap ? (
        <StaticMapComponent
          pharmacies={pharmacies}
          userLocation={userLocation}
          onPharmaciesInShape={handlePharmaciesInShape}
        />
      ) : (
        <PharmacyMap
          coordinates={userLocation}
          pharmacies={pharmacies}
          filteredPharmacies={filteredPharmacies}
          onPharmaciesInShape={handlePharmaciesInShape}
          showDefaultLocation={useLocationFilter}
          onMapError={handleMapError}
        />
      )}
    </div>
  );
}
