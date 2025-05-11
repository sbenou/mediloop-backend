
import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
}

export const SimplifiedMapUpdater = ({ coordinates }: SimplifiedMapUpdaterProps) => {
  const map = useMap();
  const hasUpdated = useRef(false);
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  useEffect(() => {
    if (!coordinates || !map || errorOccurred) return;
    
    try {
      // Validate coordinates
      const validLat = typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) 
        ? coordinates.lat : 49.8153;
      const validLon = typeof coordinates.lon === 'number' && !isNaN(coordinates.lon) 
        ? coordinates.lon : 6.1296;
      
      // Prevent unnecessary updates if coordinates haven't changed
      const currentCenter = map.getCenter();
      const isSameLocation = Math.abs(currentCenter.lat - validLat) < 0.001 && 
                             Math.abs(currentCenter.lng - validLon) < 0.001;
                             
      if (!isSameLocation || !hasUpdated.current) {
        // Use setView instead of flyTo for more stability
        map.setView([validLat, validLon], map.getZoom(), {
          animate: false
        });
        
        hasUpdated.current = true;
      }
    } catch (error) {
      console.error('Error updating map position:', error);
      setErrorOccurred(true);
    }
  }, [coordinates, map, errorOccurred]);
  
  // Add special handling for the "touchleave" error
  useEffect(() => {
    if (!map) return;
    
    try {
      // Safely patch problematic event handlers
      const originalOn = map.on;
      map.on = function(type: string, fn: any, context?: any) {
        if (type === 'touchleave') {
          console.warn('Prevented adding problematic touchleave handler');
          return map;
        }
        return originalOn.call(this, type, fn, context);
      };
    } catch (err) {
      console.error('Error patching map event handlers:', err);
    }
  }, [map]);
  
  return null;
};
