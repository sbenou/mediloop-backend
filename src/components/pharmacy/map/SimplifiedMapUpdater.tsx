
import { useEffect, useRef } from 'react';
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
  const initCompletedRef = useRef(false);
  
  useEffect(() => {
    if (!map || initCompletedRef.current) return;
    
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
        initCompletedRef.current = true;
        onMapReady();
        
        // Add additional resize after a delay for extra safety
        setTimeout(() => {
          try {
            if (map) {
              map.invalidateSize(true);
            }
          } catch (error) {
            console.warn('Error in additional map resize:', error);
          }
        }, 1000);
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 800); // Increased delay to ensure the container is fully rendered
    
    return () => clearTimeout(timer);
  }, [map, coordinates, onMapReady]);
  
  // Add a secondary effect to handle potential cases where the map wasn't ready initially
  useEffect(() => {
    if (!map || !coordinates || initCompletedRef.current) return;
    
    const secondaryTimer = setTimeout(() => {
      try {
        console.log('SimplifiedMapUpdater: Secondary map initialization');
        map.invalidateSize(true);
        
        if (coordinates && coordinates.lat && coordinates.lon) {
          map.setView([coordinates.lat, coordinates.lon], 13);
        }
        
        if (!initCompletedRef.current) {
          initCompletedRef.current = true;
          onMapReady();
        }
      } catch (error) {
        console.error('Error in secondary map initialization:', error);
      }
    }, 1500);
    
    return () => clearTimeout(secondaryTimer);
  }, [map, coordinates, onMapReady]);
  
  // Add a final fallback to force map ready state
  useEffect(() => {
    if (initCompletedRef.current) return;
    
    const fallbackTimer = setTimeout(() => {
      if (!initCompletedRef.current) {
        console.log('SimplifiedMapUpdater: Using fallback timer to mark map as ready');
        try {
          if (map) {
            map.invalidateSize(true);
            
            if (coordinates && coordinates.lat && coordinates.lon) {
              map.setView([coordinates.lat, coordinates.lon], 13);
            }
          }
          
          initCompletedRef.current = true;
          onMapReady();
        } catch (error) {
          console.error('Error in fallback map initialization:', error);
          // Even if we get an error, mark as ready to prevent UI from being stuck
          onMapReady();
        }
      }
    }, 3000); // 3 second absolute fallback
    
    return () => clearTimeout(fallbackTimer);
  }, [map, coordinates, onMapReady]);
  
  return null;
};
