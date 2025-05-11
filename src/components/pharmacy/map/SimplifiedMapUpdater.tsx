
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
    // Reset the update flag when coordinates change
    hasUpdatedRef.current = false;
  }, [coordinates.lat, coordinates.lon]);
  
  useEffect(() => {
    // Only run this once after the map and coordinates are available
    if (!map || !coordinates || hasUpdatedRef.current) {
      return;
    }
    
    try {
      // Ensure coordinates are valid numbers
      const validLat = typeof coordinates.lat === 'number' && !isNaN(coordinates.lat)
        ? coordinates.lat : 49.8153;
      const validLon = typeof coordinates.lon === 'number' && !isNaN(coordinates.lon)
        ? coordinates.lon : 6.1296;
      
      console.log('SimplifiedMapUpdater: Setting view to coordinates', { lat: validLat, lon: validLon });
      
      // Use flyTo instead of setView for a smoother transition with a shorter duration
      map.flyTo([validLat, validLon], zoom, {
        duration: 1
      });
      
      // Force a resize after setting the view to ensure proper rendering
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
      
      hasUpdatedRef.current = true;
    } catch (err) {
      console.error('Error setting map view:', err);
    }
  }, [map, coordinates, zoom]);
  
  // Return null as this is a utility component with no UI
  return null;
}
