import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
  onMapReady?: (map?: L.Map) => void;
}

export function SimplifiedMapUpdater({ coordinates, onMapReady }: SimplifiedMapUpdaterProps) {
  const map = useMap();

  // Apply coordinates and handle map ready event
  useEffect(() => {
    console.log('[DEBUG] SimplifiedMapUpdater effect running with coordinates:', coordinates);
    
    if (!map) {
      console.log('[DEBUG] Map reference is not available');
      return;
    }
    
    console.log('[DEBUG] Map reference is available, disabling handlers');
    
    try {
      // Disable ALL touch and interaction handlers that might cause issues
      // This helps prevent the "a is not a function" errors
      map.dragging?.disable();
      map.touchZoom?.disable();
      map.doubleClickZoom?.disable();
      map.scrollWheelZoom?.disable();
      map.boxZoom?.disable();
      map.keyboard?.disable();
      
      // Try to disable tap if it exists
      if ((map as any).tap) {
        console.log('[DEBUG] Disabling tap handler');
        try {
          (map as any).tap?.disable();
        } catch (e) {
          console.log('[DEBUG] Error disabling tap:', e);
        }
      }
      
      // Log the available methods on the map for debugging
      console.log('[DEBUG] Available map methods:', 
        Object.keys(map).filter(key => typeof (map as any)[key] === 'function').join(', ')
      );
      
      // Delay before calling invalidateSize to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log('[DEBUG] Delayed map update running');
        
        try {
          map.invalidateSize();
          console.log('[DEBUG] Map size invalidated successfully');
          
          // Set view to coordinates if available
          if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
            if (!isNaN(coordinates.lat) && !isNaN(coordinates.lon)) {
              console.log(`[DEBUG] Setting map view to: ${coordinates.lat}, ${coordinates.lon}`);
              map.setView([coordinates.lat, coordinates.lon], 12, { animate: false });
            }
          }
          
          // Call the onMapReady callback
          if (onMapReady) {
            console.log('[DEBUG] Calling onMapReady callback');
            onMapReady(map);
          }
        } catch (e) {
          console.error('[DEBUG] Error in SimplifiedMapUpdater timeout callback:', e);
        }
      }, 300);
      
      // Cleanup function
      return () => {
        console.log('[DEBUG] SimplifiedMapUpdater cleanup running');
        clearTimeout(timer);
      };
    } catch (e) {
      console.error('[DEBUG] Unexpected error in SimplifiedMapUpdater:', e);
    }
  }, [map, coordinates, onMapReady]);

  return null;
}
