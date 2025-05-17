
import { useEffect } from 'react';
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
  
  useEffect(() => {
    if (!map) return;
    
    const timer = setTimeout(() => {
      try {
        // Force map to update its container size
        map.invalidateSize(true);
        
        // If coordinates are provided, center the map on them
        if (coordinates && coordinates.lat && coordinates.lon) {
          map.setView([coordinates.lat, coordinates.lon], 13);
        }
        
        // Notify parent that the map is ready
        onMapReady();
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 300); // Short delay to ensure the container is fully rendered
    
    return () => clearTimeout(timer);
  }, [map, coordinates, onMapReady]);
  
  return null;
};
