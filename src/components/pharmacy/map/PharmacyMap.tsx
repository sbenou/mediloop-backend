
import { useEffect, useState, useMemo } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Map as MapIcon } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocalCache } from '@/lib/cache';
import { getMapboxToken } from '@/services/mapbox';

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
  onMapError?: () => void;
}

// Simple static map component that doesn't use Mapbox GL JS
const StaticMapFallback: React.FC<Omit<PharmacyMapProps, 'onMapError'>> = ({
  coordinates,
  pharmacies,
  filteredPharmacies,
  onPharmaciesInShape,
  showDefaultLocation
}) => {
  console.log('Rendering StaticMapFallback with', filteredPharmacies.length, 'pharmacies');
  
  // Generate static map URL with limited markers to avoid URL length issues
  const staticMapUrl = useMemo(() => {
    try {
      // Generate a cache key based on the coordinates
      const cacheKey = `static-map-${coordinates.lat.toFixed(4)}-${coordinates.lon.toFixed(4)}`;
      const cachedUrl = LocalCache.get<string>(cacheKey);
      
      if (cachedUrl) {
        return cachedUrl;
      }
      
      // For reliability, generate a URL without markers first (always works)
      const fallbackUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${coordinates.lon},${coordinates.lat},12,0/600x400?access_token=pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw`;
      
      // Cache the fallback URL
      LocalCache.set(cacheKey, fallbackUrl);
      
      return fallbackUrl;
    } catch (error) {
      console.error('Error generating static map URL:', error);
      return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    }
  }, [coordinates]);
  
  useEffect(() => {
    if (filteredPharmacies.length > 0) {
      console.log('Static map: passing filtered pharmacies to parent');
      onPharmaciesInShape(filteredPharmacies);
    }
  }, [filteredPharmacies, onPharmaciesInShape]);
  
  // Create a more reliable static map loader with error handling
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
      {!isImageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {imageError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <MapIcon className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">Map data is currently unavailable</p>
          <p className="text-sm text-gray-400 mt-2">Showing {filteredPharmacies.length} pharmacies in this area</p>
        </div>
      ) : (
        <img 
          src={staticMapUrl}
          alt="Pharmacy map" 
          className="w-full h-full object-cover"
          style={{opacity: isImageLoaded ? 1 : 0, transition: 'opacity 0.3s'}}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            console.error('Error loading map image');
            setImageError(true);
            setIsImageLoaded(false);
          }}
        />
      )}
      
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-600 px-1 py-0.5 rounded">
        {filteredPharmacies.length} pharmacies found
      </div>
      
      {/* Overlay with pharmacy cards for better UX */}
      <div className="absolute top-2 left-2 max-h-[90%] w-64 overflow-y-auto">
        <div className="space-y-2 max-h-80 overflow-auto">
          {filteredPharmacies.slice(0, 5).map((pharmacy, index) => (
            <div 
              key={pharmacy.id || index}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-sm border border-gray-100"
            >
              <p className="font-medium text-sm">{pharmacy.name || "Pharmacy"}</p>
              <p className="text-xs text-gray-600">{pharmacy.address || "No address"}</p>
            </div>
          ))}
          {filteredPharmacies.length > 5 && (
            <div className="text-xs text-center text-gray-500 pt-1">
              +{filteredPharmacies.length - 5} more pharmacies
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component - always uses the static fallback for reliability
export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation,
  onMapError
}: PharmacyMapProps) {
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  // Always use static map for stability
  return (
    <StaticMapFallback
      coordinates={coordinates}
      pharmacies={pharmacies}
      filteredPharmacies={filteredPharmacies || pharmacies}
      onPharmaciesInShape={onPharmaciesInShape}
      showDefaultLocation={showDefaultLocation}
    />
  );
}
