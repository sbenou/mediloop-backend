
import { useEffect, useState, useMemo } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Map } from 'lucide-react';
import type { ReactNode } from 'react';
import StaticMapComponent from '@/components/pharmacy/finder/StaticMapComponent';

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

// Create a simplified static map implementation to prevent errors
const StaticOnlyMap: React.FC<PharmacyMapProps> = ({
  coordinates,
  pharmacies,
  filteredPharmacies,
  onPharmaciesInShape,
  showDefaultLocation
}) => {
  console.log('Rendering StaticOnlyMap with', filteredPharmacies.length, 'pharmacies');
  
  const mapUrl = useMemo(() => {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${coordinates.lon},${coordinates.lat},12,0/600x400?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`;
  }, [coordinates]);
  
  useEffect(() => {
    if (filteredPharmacies.length > 0) {
      console.log('Static map: passing filtered pharmacies to parent');
      onPharmaciesInShape(filteredPharmacies);
    }
  }, [filteredPharmacies, onPharmaciesInShape]);
  
  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center p-6 bg-white/80 rounded-lg max-w-xs">
          <Map className="h-10 w-10 text-primary/60 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">
            Using static map view to prevent compatibility issues.
          </p>
          <p className="text-xs text-muted-foreground">
            {filteredPharmacies.length} pharmacies found 
            {showDefaultLocation ? ' near your location' : ''}
          </p>
        </div>
      </div>
      
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
      
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center text-xs">
        <p>Static map view (interactive maps disabled to prevent errors)</p>
      </div>
    </div>
  );
};

export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation 
}: PharmacyMapProps) {
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  // Notify user we're using static map
  useEffect(() => {
    toast({
      title: "Using Static Map",
      description: "Interactive maps have been disabled to prevent compatibility issues.",
      duration: 5000
    });
  }, []);
  
  // Use completely static map implementation to prevent errors
  return (
    <div className="w-full h-full relative z-10">
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
        <StaticOnlyMap 
          coordinates={coordinates}
          pharmacies={pharmacies}
          filteredPharmacies={filteredPharmacies}
          onPharmaciesInShape={onPharmaciesInShape}
          showDefaultLocation={showDefaultLocation}
        />
      </div>
    </div>
  );
}
