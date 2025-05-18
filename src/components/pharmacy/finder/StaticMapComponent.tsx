
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { LocalCache } from '@/lib/cache';
import { MapPin } from 'lucide-react';

interface StaticMapComponentProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  onPharmaciesInShape: (pharmacies: Pharmacy[]) => void;
}

/**
 * A completely static map component that doesn't rely on external services
 * This reduces API calls and serves as a fallback when map services are unavailable
 */
const StaticMapComponent: React.FC<StaticMapComponentProps> = ({
  pharmacies,
  userLocation,
  onPharmaciesInShape
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  
  // Pass all pharmacies to parent on mount
  useEffect(() => {
    console.log('StaticMapComponent: Passing all pharmacies to parent');
    onPharmaciesInShape(pharmacies);
  }, [pharmacies, onPharmaciesInShape]);
  
  // Display pharmacy locations using DOM elements instead of relying on image APIs
  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
        {/* Map container with fallback info */}
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4">
            <MapPin className="h-12 w-12 text-primary mb-2" />
            <p className="text-gray-700 text-center font-medium">Pharmacy finder</p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Found {pharmacies.length} pharmacies in this area
            </p>
          </div>
        </div>
        
        {/* Overlay info */}
        <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-600 px-1 py-0.5 rounded">
          {pharmacies.length} pharmacies nearby
        </div>
        
        {/* Show top 3 pharmacies */}
        <div className="absolute top-2 left-2 max-w-[200px]">
          <div className="space-y-1">
            {pharmacies.slice(0, 3).map((pharmacy, idx) => (
              <div 
                key={pharmacy.id || idx}
                className="bg-white/90 backdrop-blur-sm p-1 text-xs rounded shadow-sm border border-gray-100"
              >
                <p className="font-medium">{pharmacy.name || "Pharmacy"}</p>
                <p className="truncate text-gray-600">{pharmacy.address || "No address"}</p>
              </div>
            ))}
            
            {pharmacies.length > 3 && (
              <div className="text-2xs text-center text-gray-500">
                +{pharmacies.length - 3} more
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticMapComponent;
