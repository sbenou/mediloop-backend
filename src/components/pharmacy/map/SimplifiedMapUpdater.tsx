
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
  onMapReady?: () => void;
}

export const SimplifiedMapUpdater = ({ coordinates, onMapReady }: SimplifiedMapUpdaterProps) => {
  const map = useMap();
  const hasUpdated = useRef(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  const mapReadyFired = useRef(false);
  
  // Notify parent when map is ready
  useEffect(() => {
    if (!map || !onMapReady || mapReadyFired.current) return;
    
    try {
      // Wait for the map to be actually ready
      const timer = setTimeout(() => {
        try {
          // Mark as fired so we don't call it multiple times
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
  
  // Apply the most aggressive fix for "a is not a function" error - modify Leaflet internals
  useEffect(() => {
    if (!map) return;
    
    try {
      console.log("Applying touchleave error fixes");
      
      // Fix 1: Modify the prototype of the map's event handlers
      if (map._handlers) {
        for (const handler of Object.values(map._handlers)) {
          if (handler && (handler as any).disable && (handler as any).enable) {
            const originalAddHook = (handler as any).addHooks;
            
            if (typeof originalAddHook === 'function') {
              (handler as any).addHooks = function() {
                try {
                  return originalAddHook.apply(this);
                } catch (e) {
                  console.warn("Prevented error in handler hooks:", e);
                  return undefined;
                }
              };
            }
          }
        }
      }
      
      // Fix 2: Add a global error catcher specifically for this error
      const handleMapError = (event: ErrorEvent) => {
        if (
          event.message && 
          (event.message.includes('a is not a function') || 
           event.message.includes("Cannot read properties of undefined") ||
           event.message.includes("touchleave"))
        ) {
          console.warn('Caught Leaflet event error:', event.message);
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
        return false;
      };
      
      window.addEventListener('error', handleMapError, true);
      
      // Fix 3: Try to patch or remove problematic event handlers
      const originalOn = map.on;
      const problematicEvents = [
        'touchleave', 'pointerleave', 'MSPointerLeave', 
        'touchend', 'touchcancel', 'mouseout'
      ];
      
      map.on = function(types, fn, context) {
        if (!types || !fn) return this;
        
        if (typeof types === 'string') {
          // Handle single event type
          if (problematicEvents.includes(types)) {
            console.warn(`Preventing attachment of problematic event handler: ${types}`);
            
            // Attach a noop function instead to avoid errors
            return originalOn.call(this, types, function() { 
              return undefined; 
            }, context);
          }
        } else if (Array.isArray(types)) {
          // Handle array of event types
          const safeTypes = types.filter(t => !problematicEvents.includes(t));
          if (safeTypes.length !== types.length) {
            console.warn('Filtered problematic event types from array');
            
            // If all were problematic, attach a noop to the first one
            if (safeTypes.length === 0 && types.length > 0) {
              return originalOn.call(this, types[0], function() { 
                return undefined; 
              }, context);
            }
            
            return originalOn.call(this, safeTypes, fn, context);
          }
        }
        
        // Normal case, proceed as usual
        return originalOn.call(this, types, fn, context);
      };
      
      // Fix 4: Try to prevent the main container from getting problematic events
      if (map.getContainer) {
        const container = map.getContainer();
        
        problematicEvents.forEach(eventName => {
          container.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
          }, { capture: true });
        });
      }
      
      return () => {
        // Cleanup
        window.removeEventListener('error', handleMapError, true);
      };
    } catch (error) {
      console.error('Error applying Leaflet fixes:', error);
    }
  }, [map]);
  
  return null;
};
