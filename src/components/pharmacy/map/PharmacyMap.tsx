
import { useEffect, useState } from 'react';
import StaticMapComponent from '../finder/StaticMapComponent';

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

/**
 * PharmacyMap component that acts as a controller for the map display
 */
export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation
}: PharmacyMapProps) {
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  return (
    <StaticMapComponent
      pharmacies={filteredPharmacies || pharmacies}
      userLocation={coordinates}
      onPharmaciesInShape={onPharmaciesInShape}
    />
  );
}
