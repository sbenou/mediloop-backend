
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates?: { lat: number; lon: number };
  onMapReady?: () => void;
}

export const SimplifiedMapUpdater = ({ coordinates, onMapReady }: SimplifiedMapUpdaterProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      // Force a resize to ensure proper rendering
      map.invalidateSize(true);
      
      // Center the map if coordinates are provided
      if (coordinates?.lat && coordinates?.lon) {
        map.setView([coordinates.lat, coordinates.lon], 13);
      }
      
      // Notify parent components that the map is ready
      if (onMapReady) {
        // Delay to ensure the map has fully initialized
        setTimeout(() => {
          onMapReady();
        }, 200);
      }
    } catch (err) {
      console.error("Error updating map view:", err);
    }
  }, [map, coordinates, onMapReady]);
  
  return null;
};

