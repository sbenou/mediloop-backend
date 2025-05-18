
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
  
  // Distribute pins evenly across the map for visualization
  const distributedPins = useMemo(() => {
    if (!pharmacies.length) return [];
    
    // Create a grid of positions for pins
    const pinPositions = [];
    const gridSize = Math.ceil(Math.sqrt(Math.min(pharmacies.length, 12)));
    
    for (let i = 0; i < Math.min(pharmacies.length, 12); i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Create a position spread across the map
      pinPositions.push({
        pharmacy: pharmacies[i],
        top: 20 + row * (60 / gridSize), // % from top
        left: 20 + col * (60 / gridSize), // % from left
      });
    }
    
    return pinPositions;
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
              
              {/* Roads for map effect */}
              <div className="absolute inset-0">
                <div className="absolute h-1 w-4/5 bg-gray-300 top-1/4 left-1/10 transform rotate-12"></div>
                <div className="absolute h-1 w-full bg-gray-300 top-2/3 left-0 transform -rotate-6"></div>
                <div className="absolute h-full w-1 bg-gray-300 top-0 left-1/3 transform rotate-3"></div>
                <div className="absolute h-full w-1 bg-gray-300 top-0 left-2/3 transform -rotate-1"></div>
              </div>
              
              {/* User location */}
              {userLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
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
              
              {/* Pharmacy pins distributed across the map */}
              {distributedPins.map((pin, idx) => (
                <div 
                  key={`pin-${idx}`}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ 
                    top: `${pin.top}%`, 
                    left: `${pin.left}%`
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-white bg-primary"></div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Central map info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <MapIcon className="h-12 w-12 text-primary/50 mb-2" />
                <p className="text-gray-700 text-center font-medium bg-white/70 px-3 py-1 rounded-full">
                  Pharmacy Finder
                </p>
                <p className="text-sm text-gray-500 mt-2 text-center bg-white/70 px-3 py-1 rounded-full">
                  {pharmacies.length} pharmacies in this area
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
