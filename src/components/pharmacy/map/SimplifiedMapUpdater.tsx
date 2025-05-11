
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
}

export const SimplifiedMapUpdater = ({ coordinates }: SimplifiedMapUpdaterProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (!coordinates || !map) return;
    
    try {
      // Validate coordinates
      const validLat = typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) 
        ? coordinates.lat : 49.8153;
      const validLon = typeof coordinates.lon === 'number' && !isNaN(coordinates.lon) 
        ? coordinates.lon : 6.1296;
      
      // Fly to the coordinates
      map.flyTo([validLat, validLon], map.getZoom(), {
        animate: true,
        duration: 1.5
      });
      
    } catch (error) {
      console.error('Error updating map position:', error);
    }
  }, [coordinates, map]);
  
  return null;
};
