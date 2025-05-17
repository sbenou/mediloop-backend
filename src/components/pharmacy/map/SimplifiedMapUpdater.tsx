
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
        onMapReady();
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 500); // Increased delay to ensure the container is fully rendered
    
    return () => clearTimeout(timer);
  }, [map, coordinates, onMapReady]);
  
  return null;
};
