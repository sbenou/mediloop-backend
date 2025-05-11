
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
  onMapReady?: () => void;
}

export const SimplifiedMapUpdater = ({ coordinates, onMapReady }: SimplifiedMapUpdaterProps) => {
  const map = useMap();
  const hasUpdated = useRef(false);
  const mapReadyFired = useRef(false);
  
  // Notify parent when map is ready
  useEffect(() => {
    if (!map || !onMapReady || mapReadyFired.current) return;
    
    try {
      // Wait for the map to actually be ready
      const timer = setTimeout(() => {
        try {
          mapReadyFired.current = true;
          onMapReady();
          console.log("Map ready callback fired from SimplifiedMapUpdater");
        } catch (error) {
          console.error('Error in onMapReady callback:', error);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Error setting map ready timer:", err);
    }
  }, [map, onMapReady]);
  
  // Update map view when coordinates change
  useEffect(() => {
    if (!coordinates || !map) return;
    
    try {
      // Validate coordinates
      const validLat = typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) 
        ? coordinates.lat : 49.8153;
      const validLon = typeof coordinates.lon === 'number' && !isNaN(coordinates.lon) 
        ? coordinates.lon : 6.1296;
      
      // Prevent unnecessary updates if coordinates haven't changed
      const currentCenter = map.getCenter();
      const isSameLocation = Math.abs(currentCenter.lat - validLat) < 0.001 && 
                             Math.abs(currentCenter.lng - validLon) < 0.001;
                             
      if (!isSameLocation || !hasUpdated.current) {
        // Use flyTo for smoother transition
        map.flyTo([validLat, validLon], map.getZoom(), {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.25
        });
        
        hasUpdated.current = true;
      }
    } catch (error) {
      console.error('Error updating map position:', error);
    }
  }, [coordinates, map]);
  
  // Make event handling safer by patching problematic methods
  useEffect(() => {
    if (!map) return;
    
    // Store the original on method
    const originalOn = map.on;
    
    // Create a safer version of map.on that catches errors for specific events
    const safeOn = function(type: string, fn: Function, context?: any) {
      // For known problematic touch events, wrap the handler in a try-catch
      if (type === 'touchend' || type === 'touchleave' || type === 'touchcancel') {
        const safeHandler = function(e: any) {
          try {
            return fn.call(context || this, e);
          } catch (error) {
            console.warn(`Prevented error in ${type} handler:`, error);
            return undefined;
          }
        };
        return originalOn.call(this, type, safeHandler, context);
      }
      
      // Use original behavior for other events
      return originalOn.call(this, type, fn, context);
    };
    
    // Patch the map.on method
    map.on = safeOn as any;
    
    return () => {
      // Restore original method when component unmounts
      map.on = originalOn;
    };
  }, [map]);
  
  return null;
};
