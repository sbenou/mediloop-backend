
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
    console.log('SimplifiedMapUpdater effect running');
    
    if (!map) {
      console.log('Map reference is not available');
      return;
    }
    
    console.log('Map reference is available:', map);
    
    try {
      // We're going to use a safer approach by disabling all handlers that might cause issues
      console.log('Disabling potentially problematic map handlers');
      
      // Directly modify the internal handlers to prevent errors
      // These changes should help avoid "a is not a function" errors
      const safelyDisableHandler = (handlerName: string) => {
        try {
          const handler = (map as any)[handlerName];
          if (handler && typeof handler.disable === 'function') {
            console.log(`Disabling ${handlerName} handler`);
            handler.disable();
          }
        } catch (e) {
          console.log(`Error disabling ${handlerName}:`, e);
        }
      };
      
      // Disable all touch-related handlers
      safelyDisableHandler('tap');
      safelyDisableHandler('touchZoom');
      safelyDisableHandler('doubleClickZoom');
      safelyDisableHandler('boxZoom');
      safelyDisableHandler('keyboard');
      
      // Ensure the map has the right dimensions after a short delay
      const timer = setTimeout(() => {
        console.log('SimplifiedMapUpdater timer callback running');
        
        try {
          map.invalidateSize();
          console.log('Map size invalidated');
          
          // Fly to user coordinates if available
          if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
            if (!isNaN(coordinates.lat) && !isNaN(coordinates.lon)) {
              console.log(`Setting map view to: ${coordinates.lat}, ${coordinates.lon}`);
              map.setView([coordinates.lat, coordinates.lon], 12);
            } else {
              console.log('Invalid coordinates (NaN):', coordinates);
            }
          } else {
            console.log('No valid coordinates provided:', coordinates);
          }
          
          // Call the onMapReady callback
          if (onMapReady) {
            console.log('Calling onMapReady callback');
            onMapReady(map);
          }
        } catch (e) {
          console.error('Error in SimplifiedMapUpdater timer callback:', e);
        }
      }, 300); // Increased timeout to ensure DOM is fully ready
      
      // Cleanup function
      return () => {
        console.log('SimplifiedMapUpdater cleanup running');
        clearTimeout(timer);
      };
    } catch (e) {
      console.error('Unexpected error in SimplifiedMapUpdater:', e);
    }
  }, [map, coordinates, onMapReady]);

  return null;
}
