
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
      // CRITICAL: Remove ALL touch functionality to prevent "a is not a function" error
      if (map.options) {
        // Disable all interactive touch options
        map.options.touchZoom = false;
        map.options.tap = false;
        map.options.dragging = !L.Browser.mobile; // Disable dragging on mobile
        map.options.keyboard = false; // Disable keyboard navigation on mobile
        map.options.inertia = !L.Browser.mobile; // Disable inertia on mobile
        
        // Disable the touch related event handlers directly
        const touchHandlersToRemove = ['tap', 'touchZoom', 'tapHold', 'touchStart', 'touchEnd', 'touchCancel'];
        if (map._handlers) {
          // Remove existing handlers
          Object.keys(map._handlers).forEach(handlerId => {
            try {
              if (handlerId.includes('touch') || handlerId.includes('tap') || handlerId.includes('drag')) {
                map._handlers[handlerId].disable();
                console.log(`Disabled handler: ${handlerId}`);
              }
            } catch (e) {
              // Silently ignore any errors from disabling handlers
            }
          });
        }
        
        // Remove event listeners for problematic events
        if (typeof window !== 'undefined' && typeof map._container !== 'undefined') {
          try {
            // Try to remove all touch event listeners from the map container
            const container = map._container;
            ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventType => {
              container.removeEventListener(eventType, () => {}, { capture: true });
            });
          } catch (e) {
            // Silently ignore errors from event listener removal
          }
        }
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
      }, 200); // Shorter delay for faster initialization
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
