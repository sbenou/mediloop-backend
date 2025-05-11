
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
  onMapReady?: () => void;
}

export const SimplifiedMapUpdater = ({ coordinates, onMapReady }: SimplifiedMapUpdaterProps) => {
  const map = useMap();
  const hasUpdated = useRef(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const hasPatched = useRef(false);
  
  // Notify parent when map is ready
  useEffect(() => {
    if (map && onMapReady) {
      const timer = setTimeout(() => {
        try {
          onMapReady();
        } catch (error) {
          console.error('Error in onMapReady callback:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [map, onMapReady]);
  
  useEffect(() => {
    if (!coordinates || !map || errorOccurred) return;
    
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
        // Use setView instead of flyTo for more stability
        map.setView([validLat, validLon], map.getZoom(), {
          animate: false
        });
        
        hasUpdated.current = true;
      }
    } catch (error) {
      console.error('Error updating map position:', error);
      setErrorOccurred(true);
    }
  }, [coordinates, map, errorOccurred]);
  
  // Add special handling to prevent the "touchleave" error
  useEffect(() => {
    if (!map || hasPatched.current) return;
    
    try {
      console.log("Patching map event handlers to prevent touchleave error");
      
      // Mark as patched to prevent multiple patches
      hasPatched.current = true;
      
      // Patch the event handlers at different levels to prevent the error
      
      // 1. Patch the map container directly
      if (map.getContainer) {
        const container = map.getContainer();
        const originalAddEventListener = container.addEventListener;
        
        container.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: any) {
          if (type === 'touchleave' || type === 'pointerleave' || type === 'MSPointerLeave') {
            console.warn(`Prevented adding ${type} event listener to map container`);
            return undefined;
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
      }
      
      // 2. Patch map.on method to filter problematic events
      const originalOn = map.on;
      map.on = function(type: any, fn: any, context?: any) {
        if (typeof type === 'string' && 
            (type === 'touchleave' || type === 'pointerleave' || type === 'MSPointerLeave')) {
          console.warn(`Prevented adding ${type} handler to map`);
          return map;
        }
        
        if (Array.isArray(type)) {
          const safeTypes = type.filter(t => 
            t !== 'touchleave' && t !== 'pointerleave' && t !== 'MSPointerLeave'
          );
          if (safeTypes.length === 0) return map;
          if (safeTypes.length !== type.length) {
            console.warn('Filtered problematic events from event array');
            return originalOn.call(this, safeTypes, fn, context);
          }
        }
        
        return originalOn.call(this, type, fn, context);
      };
      
      // 3. Add a global error handler specifically for this error
      const handleWindowError = (event: ErrorEvent) => {
        if (event.message && event.message.includes('a is not a function')) {
          console.error('Caught "a is not a function" error from Leaflet');
          event.preventDefault();
          event.stopPropagation();
          return true; // Prevent the error from propagating
        }
        return false;
      };
      
      window.addEventListener('error', handleWindowError);
    } catch (err) {
      console.error('Error patching map event handlers:', err);
    }
  }, [map]);
  
  return null;
};
