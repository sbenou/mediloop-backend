
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { LocalCache } from '@/lib/cache';
import { getMapboxToken } from '@/services/mapbox';
import { MapPin } from 'lucide-react';

interface StaticMapComponentProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  onPharmaciesInShape: (pharmacies: Pharmacy[]) => void;
}

/**
 * A completely static map component that doesn't use Leaflet or MapboxGL
 * This reduces API calls and serves as a lightweight alternative
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
  
  // Generate a static map URL using Mapbox with markers
  const mapUrl = useMemo(() => {
    if (!userLocation) return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    
    try {
      // Create cache key based on location (rounded to 3 decimal places for caching similar positions)
      const roundedLat = Math.round(userLocation.lat * 1000) / 1000;
      const roundedLon = Math.round(userLocation.lon * 1000) / 1000;
      const cacheKey = `static-map-${roundedLat}-${roundedLon}-12`;
      
      // Check cache first
      const cachedUrl = LocalCache.get<string>(cacheKey);
      if (cachedUrl) {
        console.log('Using cached static map URL');
        return cachedUrl;
      }
      
      // Get a Mapbox token
      const token = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';
      
      // Generate simple static map URL without markers to avoid URL length issues
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${userLocation.lon},${userLocation.lat},12,0/600x400?access_token=${token}`;
      
      // Cache the URL
      LocalCache.set(cacheKey, url);
      
      return url;
    } catch (error) {
      console.error('Error generating static map URL:', error);
      return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    }
  }, [userLocation]);
  
  // Handle image loading state
  const handleImageLoaded = () => {
    setIsLoading(false);
    setMapError(false);
  };
  
  // Handle image loading errors
  const handleImageError = () => {
    console.error('Error loading map image');
    setIsLoading(false);
    setMapError(true);
  };
  
  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
        
        {/* Error state */}
        {mapError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4">
            <MapPin className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">Map temporarily unavailable</p>
            <p className="text-sm text-gray-400 mt-2 text-center">
              {pharmacies.length} pharmacies found in this area
            </p>
          </div>
        )}
        
        {/* Static map image */}
        <div className="w-full h-full bg-gray-50">
          <img 
            src={mapUrl}
            alt="Static pharmacy map" 
            className="w-full h-full object-cover"
            style={{ opacity: !isLoading && !mapError ? 1 : 0 }}
            onLoad={handleImageLoaded}
            onError={handleImageError}
          />
        </div>
        
        {/* Overlay info */}
        <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-600 px-1 py-0.5 rounded">
          {pharmacies.length} pharmacies found
        </div>
        
        {/* Show top 3 pharmacies */}
        {!isLoading && !mapError && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default StaticMapComponent;
