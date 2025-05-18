
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
    if (!map) return;
    
    // Disable problematic handlers that may cause "a is not a function" errors
    if (map.tap) map.tap.disable();
    if (map.touchZoom) map.touchZoom.disable();
    if (map.doubleClickZoom) map.doubleClickZoom.disable();
    
    // Set options directly to prevent handlers from being re-enabled
    if (map.options) {
      map.options.tap = false;
      map.options.touchZoom = false;
      map.options.doubleClickZoom = false;
    }
    
    // Ensure the map has the right dimensions after a short delay
    const timer = setTimeout(() => {
      map.invalidateSize();
      
      // Fly to user coordinates if available
      if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
        if (!isNaN(coordinates.lat) && !isNaN(coordinates.lon)) {
          map.setView([coordinates.lat, coordinates.lon], 12);
        }
      }
      
      // Call the onMapReady callback
      if (onMapReady) {
        onMapReady(map);
      }
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [map, coordinates, onMapReady]);

  return null;
}
