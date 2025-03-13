
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
      if (typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
        console.log('SimplifiedMapUpdater: Setting view to coordinates', coordinates);
        
        // Use flyTo instead of setView for a smoother transition
        // This approach is less likely to cause event handling issues
        map.flyTo([coordinates.lat, coordinates.lon], zoom, {
          duration: 1.5,  // Animation duration in seconds
          easeLinearity: 0.25
        });
        
        hasUpdatedRef.current = true;
      }
    } catch (err) {
      console.error('Error setting map view:', err);
    }
    
    // Clean up function is intentionally empty - we don't attach any events
    return () => {
      // No event handlers to remove
    };
  }, [map, coordinates, zoom]);
  
  // Return null as this is a utility component with no UI
  return null;
}
