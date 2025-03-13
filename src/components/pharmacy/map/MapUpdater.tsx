
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from "@/components/ui/use-toast";

interface MapUpdaterProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
  defaultZoom?: number;
}

export function MapUpdater({ 
  coordinates, 
  pharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation, 
  defaultZoom = 10 
}: MapUpdaterProps) {
  const map = useMap();
  const hasFilteredRef = useRef(false);
  
  // Create a logger for this component to help diagnose issues
  const log = (message: string, data?: any) => {
    console.log(`MapUpdater: ${message}`, data ? data : '');
  };
  
  log('component rendering', {
    mapExists: !!map,
    coordsExist: !!coordinates,
    pharmCount: pharmacies?.length || 0
  });
  
  // Update map view when coordinates change
  useEffect(() => {
    if (!map || !coordinates) return;
    
    try {
      if (showDefaultLocation && 
          typeof coordinates.lat === 'number' && 
          typeof coordinates.lon === 'number') {
        log('setting view to user location');
        
        // Use flyTo instead of setView for smoother transition
        map.flyTo([coordinates.lat, coordinates.lon], defaultZoom, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } catch (err) {
      log('error setting map view', err);
    }
  }, [map, coordinates, showDefaultLocation, defaultZoom]);
  
  // Filter pharmacies when location changes
  useEffect(() => {
    if (!coordinates || !Array.isArray(pharmacies)) return;
    
    try {
      if (showDefaultLocation) {
        const validCoordinates = coordinates && 
          typeof coordinates.lat === 'number' && 
          typeof coordinates.lon === 'number';
          
        if (validCoordinates) {
          log('filtering pharmacies by location');
          const userLocation = L.latLng(coordinates.lat, coordinates.lon);
          const nearbyPharmacies = pharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            try {
              const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
              return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
            } catch (err) {
              log('error calculating distance', err);
              return false;
            }
          });
          
          // Avoid unnecessary re-renders
          if (!hasFilteredRef.current) {
            onPharmaciesInShape(nearbyPharmacies);
            hasFilteredRef.current = true;
            
            toast({
              title: "Location filter applied",
              description: `Found ${nearbyPharmacies.length} pharmacies within 2km`,
            });
          }
        }
      } else {
        // When not using location filtering, show all pharmacies
        if (hasFilteredRef.current) {
          onPharmaciesInShape(pharmacies);
          hasFilteredRef.current = false;
        }
      }
    } catch (err) {
      log('error in filter effect', err);
      onPharmaciesInShape(pharmacies); // Fallback to all pharmacies
    }
  }, [coordinates, pharmacies, showDefaultLocation, onPharmaciesInShape]);
  
  // Reset the filter flag when showDefaultLocation changes
  useEffect(() => {
    hasFilteredRef.current = false;
  }, [showDefaultLocation]);
  
  return null;
}
