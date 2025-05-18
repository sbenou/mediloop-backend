
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { MapPin, Map as MapIcon, Building, Navigation, Search } from 'lucide-react';

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
  
  // Get the top pharmacies with the most complete information
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
    const gridSize = Math.ceil(Math.sqrt(Math.min(pharmacies.length, 30)));
    
    for (let i = 0; i < Math.min(pharmacies.length, 30); i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      
      // Create a position spread across the map, with some randomness
      const randomOffsetX = Math.random() * 10 - 5;
      const randomOffsetY = Math.random() * 10 - 5;
      
      pinPositions.push({
        pharmacy: pharmacies[i],
        top: 15 + row * (70 / gridSize) + randomOffsetY, // % from top
        left: 15 + col * (70 / gridSize) + randomOffsetX, // % from left
        size: Math.random() > 0.7 ? 'large' : 'normal', // Some pins are larger to create depth
      });
    }
    
    return pinPositions;
  }, [pharmacies]);

  // Generate some random street patterns for the map
  const streets = useMemo(() => {
    const streetPatterns = [];
    
    // Main roads
    streetPatterns.push({
      type: 'main',
      paths: [
        'M-10,50 L110,50', // Horizontal across center
        'M50,-10 L50,110', // Vertical across center
        'M-10,30 L110,30', // Upper horizontal
        'M-10,70 L110,70', // Lower horizontal
        'M30,-10 L30,110', // Left vertical
        'M70,-10 L70,110', // Right vertical
      ]
    });
    
    // Secondary roads
    streetPatterns.push({
      type: 'secondary',
      paths: [
        'M-10,20 L110,20', // Upper horizontal
        'M-10,40 L110,40', // Middle upper horizontal
        'M-10,60 L110,60', // Middle lower horizontal
        'M-10,80 L110,80', // Lower horizontal
        'M20,-10 L20,110', // Left vertical
        'M40,-10 L40,110', // Middle left vertical
        'M60,-10 L60,110', // Middle right vertical
        'M80,-10 L80,110', // Right vertical
      ]
    });
    
    // Diagonal roads for interest
    streetPatterns.push({
      type: 'diagonal',
      paths: [
        'M-10,-10 L110,110', // Diagonal from top-left to bottom-right
        'M-10,110 L110,-10', // Diagonal from bottom-left to top-right
        'M20,-10 L80,110', // Shorter diagonal
        'M-10,80 L110,20', // Another diagonal
      ]
    });
    
    return streetPatterns;
  }, []);
  
  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
        {/* Map container with pharmacy visualization */}
        <div className="w-full h-full relative overflow-hidden">
          <div className="absolute inset-0">
            {/* Map background with subtle pattern */}
            <div className="absolute inset-0" style={{ 
              backgroundColor: '#e9edf5',
              backgroundImage: `
                linear-gradient(0deg, rgba(240,242,245,0.8) 0%, rgba(233,237,245,0.8) 100%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e4eb' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
              `,
            }} />
            
            {/* Water areas */}
            <div className="absolute left-[20%] top-[70%] w-[25%] h-[20%] rounded-full opacity-60" 
                 style={{ background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' }}></div>
            <div className="absolute right-[10%] top-[20%] w-[15%] h-[15%] rounded-full opacity-60"
                 style={{ background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)' }}></div>
            
            {/* Green areas / parks */}
            <div className="absolute left-[10%] top-[30%] w-[20%] h-[15%] rounded-lg opacity-60"
                 style={{ background: 'linear-gradient(to top, #c1dfc4 0%, #deecdd 100%)' }}></div>
            <div className="absolute right-[25%] top-[50%] w-[18%] h-[18%] rounded-lg opacity-60"
                 style={{ background: 'linear-gradient(to top, #c1dfc4 0%, #deecdd 100%)' }}></div>
            
            {/* Street grid for map effect */}
            <svg className="absolute inset-0 w-full h-full opacity-70 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              {/* Main roads */}
              <g stroke="#c0c0c0" strokeWidth="3" strokeOpacity="0.7">
                {streets[0].paths.map((path, idx) => (
                  <path key={`main-${idx}`} d={path} fill="none" />
                ))}
              </g>
              
              {/* Secondary roads */}
              <g stroke="#d0d0d0" strokeWidth="2" strokeOpacity="0.5">
                {streets[1].paths.map((path, idx) => (
                  <path key={`secondary-${idx}`} d={path} fill="none" />
                ))}
              </g>
              
              {/* Diagonal roads */}
              <g stroke="#d0d0d0" strokeWidth="2" strokeOpacity="0.4">
                {streets[2].paths.map((path, idx) => (
                  <path key={`diagonal-${idx}`} d={path} fill="none" strokeDasharray="5,5" />
                ))}
              </g>
            </svg>

            {/* City blocks as subtle background elements */}
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 gap-1 opacity-30 pointer-events-none">
              {[...Array(25)].map((_, idx) => (
                <div key={`block-${idx}`} className="bg-gray-100 rounded"></div>
              ))}
            </div>

            {/* User location */}
            {userLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <Navigation className="h-3 w-3 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-blue-400 rounded-full opacity-30 animate-ping"></div>
                  <div className="text-xs font-medium bg-white px-2 py-0.5 rounded shadow-sm mt-1 text-center">
                    You
                  </div>
                </div>
              </div>
            )}
            
            {/* Pharmacy pins - the main pins on the map */}
            {distributedPins.map((pin, idx) => (
              <div 
                key={`pin-${idx}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity hover:z-30"
                style={{ 
                  top: `${pin.top}%`, 
                  left: `${pin.left}%`,
                  opacity: pin.size === 'large' ? 1 : 0.85,
                }}
              >
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="relative">
                    <div className={`
                      ${pin.size === 'large' ? 'h-6 w-6' : 'h-5 w-5'} 
                      bg-primary rounded-full flex items-center justify-center shadow-md
                    `}>
                      <MapPin className={`
                        ${pin.size === 'large' ? 'h-3.5 w-3.5' : 'h-3 w-3'} 
                        text-white
                      `} />
                    </div>
                    <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-white bg-primary"></div>
                  </div>
                  {/* Tooltip - only visible on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded shadow-md mt-1 text-xs font-medium max-w-[120px] text-center">
                    {pin.pharmacy.name || "Pharmacy"}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Central map info - this is what displays "Pharmacy Finder" and the count */}
            <div className="absolute right-2 bottom-3 flex flex-col items-end pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-gray-700">
                  Pharmacy Finder
                </p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm mt-1">
                <p className="text-xs text-gray-600">
                  {pharmacies.length} pharmacies in this area
                </p>
              </div>
            </div>
            
            {/* Additional map decoration - compass */}
            <div className="absolute top-3 right-3 bg-white/80 rounded-full p-1 shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="1" fill="#fff" />
                <path d="M12 2L12 22" stroke="#d1d5db" strokeWidth="1" />
                <path d="M2 12L22 12" stroke="#d1d5db" strokeWidth="1" />
                <path d="M12 2L15 12L12 22L9 12L12 2Z" fill="#9b87f5" fillOpacity="0.3" />
                <text x="12" y="6" textAnchor="middle" fontSize="4" fill="#9b87f5">N</text>
                <text x="12" y="20" textAnchor="middle" fontSize="4" fill="#9b87f5">S</text>
                <text x="4" y="12" textAnchor="middle" fontSize="4" fill="#9b87f5">W</text>
                <text x="20" y="12" textAnchor="middle" fontSize="4" fill="#9b87f5">E</text>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Pharmacy list overlay - showing top pharmacies in a collapsible section */}
        <div className="absolute top-3 left-3 max-w-[200px] z-30">
          <div className="space-y-1">
            {topPharmacies.slice(0, 3).map((pharmacy, idx) => (
              <div 
                key={pharmacy.id || idx}
                className="bg-white/95 backdrop-blur-sm p-2 text-xs rounded-md shadow-sm border border-gray-100 hover:bg-white transition-colors"
              >
                <p className="font-medium text-gray-800">{pharmacy.name || "Pharmacy"}</p>
                <p className="truncate text-gray-600">{pharmacy.address || "No address"}</p>
              </div>
            ))}
            
            {pharmacies.length > 3 && (
              <div className="text-xs text-center text-gray-500 bg-white/90 rounded-md py-1 px-2">
                +{pharmacies.length - 3} more pharmacies
              </div>
            )}
          </div>
        </div>

        {/* Search bar mockup */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 max-w-[300px] w-full z-30">
          <div className="bg-white shadow-md rounded-md flex items-center px-3 py-2">
            <input 
              type="text" 
              placeholder="Search pharmacies..." 
              className="text-sm flex-1 border-none focus:outline-none bg-transparent"
              disabled
            />
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticMapComponent;
