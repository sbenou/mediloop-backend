
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { MapPin, Map as MapIcon, Navigation, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StaticMapComponentProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  onPharmaciesInShape: (pharmacies: Pharmacy[]) => void;
}

/**
 * An interactive map component that visually displays pharmacies
 */
const StaticMapComponent: React.FC<StaticMapComponentProps> = ({
  pharmacies,
  userLocation,
  onPharmaciesInShape
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredPharmacy, setHoveredPharmacy] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mapContainerRef.current) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Add constraints to prevent dragging too far
      const maxDrag = 1000 * zoom;
      const constrainedX = Math.max(Math.min(newX, maxDrag), -maxDrag);
      const constrainedY = Math.max(Math.min(newY, maxDrag), -maxDrag);
      
      setPosition({ 
        x: constrainedX,
        y: constrainedY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom functionality
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3)); // Limit maximum zoom
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5)); // Limit minimum zoom
  };

  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
        {/* Map container with pharmacy visualization */}
        <div 
          className="w-full h-full relative overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          ref={mapContainerRef}
        >
          <div className="absolute inset-0">
            {/* Map background with realistic map styling */}
            <div 
              className="absolute inset-0" 
              style={{ 
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                backgroundColor: '#e9edf5',
                backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/6.1296,49.8153,10/1200x800?access_token=pk.eyJ1IjoibG92YWJsZS1haS1tYXBib3giLCJhIjoiY2x2YjN6NDRpMDE1azJpbzNnMjEzMmswZSJ9.3yGtbePojDGfBWpGk6YXYw")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {/* User location */}
            {userLocation && (
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{ 
                  transform: `translate(-50%, -50%) scale(${1/zoom}) translate(${position.x}px, ${position.y}px)`
                }}
              >
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
                  transform: `translate(-50%, -50%) scale(${1/zoom})`,
                }}
                onMouseEnter={() => setHoveredPharmacy(pin.pharmacy.id)}
                onMouseLeave={() => setHoveredPharmacy(null)}
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
                  {hoveredPharmacy === pin.pharmacy.id && (
                    <div className="bg-white p-2 rounded shadow-md mt-2 text-xs font-medium max-w-[150px] text-center z-50">
                      <p className="font-semibold">{pin.pharmacy.name || "Pharmacy"}</p>
                      <p className="text-xs text-gray-600 mt-1">{pin.pharmacy.address || "No address"}</p>
                    </div>
                  )}
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

            {/* Zoom controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-1 z-30">
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 w-8 p-0 shadow-md"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="h-8 w-8 p-0 shadow-md"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
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
                onMouseEnter={() => setHoveredPharmacy(pharmacy.id)}
                onMouseLeave={() => setHoveredPharmacy(null)}
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
