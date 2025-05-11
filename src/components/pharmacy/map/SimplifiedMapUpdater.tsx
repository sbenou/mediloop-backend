
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
          console.log("Map ready callback fired");
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
  
  // Apply safer event handling for problematic events
  useEffect(() => {
    if (!map) return;
    
    // Safe wrapper function for touch events
    const makeEventSafe = (eventName) => {
      const originalOn = map.on;
      
      map.on = function(type, fn, context) {
        if (type === eventName) {
          const safeHandler = (e) => {
            try {
              return fn.call(context || this, e);
            } catch (error) {
              console.warn(`Prevented error in ${eventName} handler:`, error);
              return undefined;
            }
          };
          return originalOn.call(this, type, safeHandler, context);
        }
        return originalOn.call(this, type, fn, context);
      };
    };
    
    // Apply safer event handling for problematic events
    const problematicEvents = ['touchend', 'touchleave', 'touchcancel'];
    problematicEvents.forEach(makeEventSafe);
    
    return () => {
      // Restore original on method if possible
      if (map._originalOn) {
        map.on = map._originalOn;
      }
    };
  }, [map]);
  
  return null;
};
