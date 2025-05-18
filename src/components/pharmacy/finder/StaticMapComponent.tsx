
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import type { Pharmacy } from '@/lib/types/overpass.types';

interface StaticMapComponentProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  onPharmaciesInShape: (pharmacies: Pharmacy[]) => void;
}

/**
 * A completely static map component that doesn't use Leaflet
 * This avoids the "a is not a function" errors on mobile devices
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
      title: "Static Map Active",
      description: "Using static map to avoid compatibility issues.",
      duration: 3000
    });
  }, [pharmacies, onPharmaciesInShape]);
  
  // Generate a static map URL using Mapbox (fallback to OpenStreetMap if URL fails)
  const mapUrl = React.useMemo(() => {
    if (!userLocation) return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    
    try {
      // Use Mapbox static image API
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${userLocation.lon},${userLocation.lat},11,0/600x400@2x?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`;
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
            <h3 className="text-base font-medium mb-2">Static Map View</h3>
            <p className="text-sm text-gray-600 mb-3">
              Interactive maps are disabled to prevent compatibility issues.
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
