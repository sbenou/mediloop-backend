
import { useState, useEffect, useCallback } from 'react';
import { PharmacyMap } from '../map/PharmacyMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

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
  
  // Handle pharmacies that are filtered by the map (when drawing shapes)
  const handlePharmaciesInShape = useCallback((inShapePharmacies: any[]) => {
    console.log(`Map filtered ${inShapePharmacies.length} pharmacies`);
    // Update filtered pharmacies
    setFilteredPharmacies(inShapePharmacies);
  }, []);
  
  if (!userLocation) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }
  
  // Success toast for when the map loads properly
  useEffect(() => {
    if (pharmacies.length > 0) {
      toast({
        title: "Pharmacy map loaded",
        description: `${pharmacies.length} pharmacies found in this area`,
        duration: 3000
      });
    }
  }, [pharmacies.length]);
  
  return (
    <div className="w-full h-full">
      <PharmacyMap
        coordinates={userLocation}
        pharmacies={pharmacies}
        filteredPharmacies={filteredPharmacies}
        onPharmaciesInShape={handlePharmaciesInShape}
        showDefaultLocation={useLocationFilter}
      />
    </div>
  );
}
