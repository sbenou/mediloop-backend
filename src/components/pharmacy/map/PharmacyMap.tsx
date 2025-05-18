
import { useEffect, useState, useMemo } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Map as MapIcon } from 'lucide-react';
import { LocalCache } from '@/lib/cache';
import StaticMapComponent from '../finder/StaticMapComponent';

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
  onMapError?: () => void;
}

/**
 * PharmacyMap component that uses the static map component for reliability
 */
export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation,
  onMapError
}: PharmacyMapProps) {
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  // Always use static map for stability
  return (
    <StaticMapComponent
      pharmacies={filteredPharmacies || pharmacies}
      userLocation={coordinates}
      onPharmaciesInShape={onPharmaciesInShape}
    />
  );
}
