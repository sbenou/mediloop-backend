
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { MapPin, Map as MapIcon, Building, Navigation } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  
  // Pass all pharmacies to parent on mount
  useEffect(() => {
    console.log('StaticMapComponent: Passing all pharmacies to parent');
    onPharmaciesInShape(pharmacies);
  }, [pharmacies, onPharmaciesInShape]);
  
  // Get the top 3 pharmacies with the most complete information
  const topPharmacies = useMemo(() => {
    return pharmacies
      .filter(p => p.name && p.name.length > 0)
      .sort((a, b) => {
        // Score completeness of pharmacy data
        const scoreA = (a.name ? 2 : 0) + (a.address ? 1 : 0) + (a.hours ? 1 : 0);
        const scoreB = (b.name ? 2 : 0) + (b.address ? 1 : 0) + (b.hours ? 1 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [pharmacies]);
  
  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
        {/* Map container with pharmacy visualization */}
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200 p-4">
            {/* Stylized map background */}
            <div className="h-full w-full relative overflow-hidden rounded-md bg-gray-100">
              {/* Grid lines for map effect */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(90deg, rgba(226,232,240,0.5) 1px, transparent 1px), linear-gradient(rgba(226,232,240,0.5) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
              
              {/* User location */}
              {userLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Navigation className="h-3 w-3 text-white" />
                    </div>
                    <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                    <div className="text-xs font-medium bg-white px-2 py-0.5 rounded shadow-sm mt-1 text-center">
                      You
                    </div>
                  </div>
                </div>
              )}
              
              {/* Stylized pharmacy pins - distributed around the map */}
              {pharmacies.length > 0 && Array(Math.min(8, pharmacies.length)).fill(0).map((_, idx) => {
                // Create visually distributed pins for decorative purposes
                const angle = (idx / 8) * 2 * Math.PI;
                const distance = 30 + Math.random() * 20; // Distance from center (30-50%)
                const left = 50 + Math.cos(angle) * distance;
                const top = 50 + Math.sin(angle) * distance;
                
                return (
                  <div 
                    key={idx}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ 
                      left: `${left}%`, 
                      top: `${top}%`,
                      zIndex: 5
                    }}
                  >
                    <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                      <MapPin className="h-2 w-2 text-white" />
                    </div>
                  </div>
                );
              })}
              
              {/* Central map info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <MapIcon className="h-12 w-12 text-primary mb-2 opacity-90" />
                <p className="text-gray-700 text-center font-medium">
                  Pharmacy Finder
                </p>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Showing {pharmacies.length} pharmacies in this area
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Overlay info */}
        <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-600 px-1 py-0.5 rounded">
          {pharmacies.length} pharmacies nearby
        </div>
        
        {/* Show top pharmacies */}
        <div className="absolute top-2 left-2 max-w-[200px]">
          <div className="space-y-1">
            {topPharmacies.map((pharmacy, idx) => (
              <div 
                key={pharmacy.id || idx}
                className="bg-white/90 backdrop-blur-sm p-1 text-xs rounded shadow-sm border border-gray-100"
              >
                <p className="font-medium">{pharmacy.name || "Pharmacy"}</p>
                <p className="truncate text-gray-600">{pharmacy.address || "No address"}</p>
              </div>
            ))}
            
            {pharmacies.length > 5 && (
              <div className="text-xs text-center text-gray-500 bg-white/80 rounded py-1">
                +{pharmacies.length - 5} more pharmacies
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticMapComponent;
