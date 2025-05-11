
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number };
  zoom?: number;
}

export function SimplifiedMapUpdater({ coordinates, zoom = 10 }: SimplifiedMapUpdaterProps) {
  const map = useMap();
  const hasUpdatedRef = useRef(false);
  
  useEffect(() => {
    // Only run this once after the map and coordinates are available
    if (!map || !coordinates) {
      console.log('Map or coordinates not available yet');
      return;
    }
    
    try {
      // Ensure coordinates are valid numbers
      const validLat = typeof coordinates.lat === 'number' && !isNaN(coordinates.lat)
        ? coordinates.lat : 49.8153;
      const validLon = typeof coordinates.lon === 'number' && !isNaN(coordinates.lon)
        ? coordinates.lon : 6.1296;
      
      console.log('SimplifiedMapUpdater: Setting view to coordinates', { lat: validLat, lon: validLon });
      
      // Use flyTo instead of setView for a smoother transition
      map.flyTo([validLat, validLon], zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
      
      // Force a resize after setting the view to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
      
      hasUpdatedRef.current = true;
    } catch (err) {
      console.error('Error setting map view:', err);
    }
    
    return () => {
      // Cleanup function - no event handlers to remove
    };
  }, [map, coordinates, zoom]);
  
  // Return null as this is a utility component with no UI
  return null;
}
