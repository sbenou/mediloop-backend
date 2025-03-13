
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number };
  zoom?: number;
}

export function SimplifiedMapUpdater({ coordinates, zoom = 10 }: SimplifiedMapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !coordinates) return;
    
    try {
      if (typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
        console.log('SimplifiedMapUpdater: setting view to coordinates', coordinates);
        map.setView([coordinates.lat, coordinates.lon], zoom);
      }
    } catch (err) {
      console.error('Error setting map view:', err);
    }
    
    // No event handlers here to avoid issues
    
    return () => {
      // Clean cleanup - no handlers to remove
    };
  }, [map, coordinates, zoom]);
  
  return null;
}
