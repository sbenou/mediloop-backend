
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
  onMapReady: () => void;
}

export const SimplifiedMapUpdater: React.FC<SimplifiedMapUpdaterProps> = ({ 
  coordinates,
  onMapReady
}) => {
  const map = useMap();
  const initCompletedRef = useRef(false);
  
  // Primary initialization effect - runs once when map is first mounted
  useEffect(() => {
    if (!map || initCompletedRef.current) return;
    
    console.log('SimplifiedMapUpdater: Starting initialization');
    
    try {
      // IMPORTANT: Completely disable ALL touch-related handlers to prevent "a is not a function" error
      // This is the most aggressive approach to fix the persistent error
      if (map.options) {
        map.options.touchZoom = false;
        map.options.tap = false;
        map.options.dragging = !L.Browser.mobile; // Disable dragging on mobile devices
        
        // Remove all touch-related handlers from the map instance
        if (map._handlers) {
          for (const handlerId in map._handlers) {
            const handler = map._handlers[handlerId];
            if (handlerId.includes('touch') || handlerId.includes('tap')) {
              try {
                handler.disable();
                console.log(`Disabled handler: ${handlerId}`);
              } catch (e) {
                console.warn(`Failed to disable handler ${handlerId}:`, e);
              }
            }
          }
        }
        
        // Disable specific problematic handlers by name
        const handlersToDisable = ['tap', 'touchZoom', 'tapHold', 'touchStart', 'touchEnd', 'touchCancel'];
        handlersToDisable.forEach(handlerName => {
          if ((map as any)[handlerName]) {
            try {
              (map as any)[handlerName].disable();
            } catch (e) {
              console.warn(`Failed to disable ${handlerName}:`, e);
            }
          }
        });
      }
      
      // Force a delay before proceeding to ensure handlers are properly disabled
      setTimeout(() => {
        try {
          console.log('SimplifiedMapUpdater: Initializing map');
          
          // Force map to update its container size
          map.invalidateSize(true);
          
          // If coordinates are provided, center the map on them
          if (coordinates && coordinates.lat && coordinates.lon) {
            console.log('SimplifiedMapUpdater: Setting view to coordinates:', coordinates);
            map.setView([coordinates.lat, coordinates.lon], 13);
          }
          
          // Notify parent that the map is ready
          console.log('SimplifiedMapUpdater: Map ready, notifying parent');
          initCompletedRef.current = true;
          onMapReady();
          
          // Add additional resize after a delay for extra safety
          setTimeout(() => {
            if (map) {
              map.invalidateSize(true);
            }
          }, 500);
        } catch (error) {
          console.error('Error initializing map:', error);
          // Even with errors, mark as ready to prevent UI from being stuck
          if (!initCompletedRef.current) {
            initCompletedRef.current = true;
            onMapReady();
          }
        }
      }, 500); // Shorter delay to improve initial load time
    } catch (error) {
      console.error('Error during map initialization:', error);
      // Ensure we always call onMapReady even if there's an error
      if (!initCompletedRef.current) {
        initCompletedRef.current = true;
        onMapReady(); 
      }
    }
    
    // No cleanup needed for touch handler disabling
  }, [map, coordinates, onMapReady]);
  
  // Secondary effect to handle coordinate changes after initialization
  useEffect(() => {
    if (!map || !coordinates || !initCompletedRef.current) return;
    
    try {
      console.log('SimplifiedMapUpdater: Updating map view for new coordinates');
      map.invalidateSize(true);
      map.setView([coordinates.lat, coordinates.lon], 13);
    } catch (error) {
      console.error('Error updating map view:', error);
    }
  }, [map, coordinates]);
  
  return null;
};
