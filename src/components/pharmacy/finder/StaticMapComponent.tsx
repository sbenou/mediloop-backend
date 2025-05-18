
import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { LocalCache } from '@/lib/cache';

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
  // Pass all pharmacies to parent on mount
  React.useEffect(() => {
    console.log('StaticMapComponent: Passing all pharmacies to parent');
    onPharmaciesInShape(pharmacies);
    
    toast({
      title: "Alternative Static Map Active",
      description: "Using static map with efficient caching to reduce API calls (for demonstration purposes).",
      duration: 3000
    });
  }, [pharmacies, onPharmaciesInShape]);
  
  // Generate a static map URL using Mapbox with caching
  const mapUrl = useMemo(() => {
    if (!userLocation) return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    
    try {
      // Create cache key based on location (rounded to 3 decimal places for caching similar positions)
      const roundedLat = Math.round(userLocation.lat * 1000) / 1000;
      const roundedLon = Math.round(userLocation.lon * 1000) / 1000;
      const cacheKey = `static-map-${roundedLat}-${roundedLon}-11`;
      
      // Check cache first
      const cachedUrl = LocalCache.get<string>(cacheKey);
      if (cachedUrl) {
        console.log('Using cached static map URL');
        return cachedUrl;
      }
      
      // Generate new URL
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${userLocation.lon},${userLocation.lat},11,0/600x400@2x?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`;
      
      // Cache the URL
      LocalCache.set(cacheKey, url);
      
      return url;
    } catch (error) {
      console.error('Error generating static map URL:', error);
      return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    }
  }, [userLocation]);
  
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0 h-full relative">
        {/* Static map overlay with explanation */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-white/90 rounded-lg max-w-xs">
            <MapPin className="h-10 w-10 text-primary/60 mx-auto mb-2" />
            <h3 className="text-base font-medium mb-2">Alternative Static View</h3>
            <p className="text-sm text-gray-600 mb-3">
              Using cached static maps to reduce API usage.
              <br />
              <span className="text-xs text-muted-foreground">(This is an example of a non-interactive alternative)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {pharmacies.length} pharmacies available in this area
            </p>
          </div>
        </div>
        
        {/* Static map image */}
        <div className="w-full h-full bg-gray-100 relative">
          <img 
            src={mapUrl}
            alt="Static pharmacy map" 
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticMapComponent;
