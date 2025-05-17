
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

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
  
  // Primary initialization effect
  useEffect(() => {
    if (!map || initCompletedRef.current) return;
    
    console.log('SimplifiedMapUpdater: Starting initialization');
    
    // Disable problematic touch handlers that might cause the "a is not a function" error
    try {
      // @ts-ignore - These properties exist on Leaflet map but might not be in TypeScript defs
      if (map.touchZoom) map.touchZoom.disable();
      // @ts-ignore
      if (map.tap) map.tap.disable();
      
      // Some browsers have issues with these handlers
      if (map.options) {
        map.options.touchZoom = false;
        map.options.tap = false;
      }
    } catch (err) {
      console.warn('Error disabling touch handlers:', err);
    }
    
    // Use a slightly longer delay to ensure the container is ready
    const timer = setTimeout(() => {
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
          try {
            if (map) {
              map.invalidateSize(true);
            }
          } catch (error) {
            console.warn('Error in additional map resize:', error);
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 1000); // Delay to ensure the container is fully rendered
    
    return () => clearTimeout(timer);
  }, [map, coordinates, onMapReady]);
  
  // Secondary effect to handle coordinate changes
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
  
  // Final fallback to force map ready state
  useEffect(() => {
    if (initCompletedRef.current) return;
    
    const fallbackTimer = setTimeout(() => {
      if (!initCompletedRef.current) {
        console.log('SimplifiedMapUpdater: Using fallback timer to mark map as ready');
        try {
          if (map) {
            // Disable problematic touch handlers again in fallback
            try {
              // @ts-ignore
              if (map.touchZoom) map.touchZoom.disable();
              // @ts-ignore
              if (map.tap) map.tap.disable();
            } catch (e) {
              console.warn('Error disabling touch handlers in fallback:', e);
            }
            
            map.invalidateSize(true);
            
            if (coordinates && coordinates.lat && coordinates.lon) {
              map.setView([coordinates.lat, coordinates.lon], 13);
            }
          }
          
          initCompletedRef.current = true;
          onMapReady();
        } catch (error) {
          console.error('Error in fallback map initialization:', error);
          // Even if we get an error, mark as ready to prevent UI from being stuck
          onMapReady();
        }
      }
    }, 2000); // 2 second absolute fallback
    
    return () => clearTimeout(fallbackTimer);
  }, [map, coordinates, onMapReady]);
  
  return null;
};
