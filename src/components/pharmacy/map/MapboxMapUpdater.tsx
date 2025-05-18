
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { getMapboxToken } from '@/services/mapbox';

interface MapboxMapUpdaterProps {
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  coordinates: { lat: number; lon: number } | null;
  onMapReady?: (map?: mapboxgl.Map) => void;
}

export function MapboxMapUpdater({ mapRef, coordinates, onMapReady }: MapboxMapUpdaterProps) {
  const isUpdated = useRef(false);

  // Apply coordinates and handle map ready event
  useEffect(() => {
    console.log('[DEBUG] MapboxMapUpdater effect running with coordinates:', coordinates);
    
    if (!mapRef.current) {
      console.log('[DEBUG] Map reference is not available');
      return;
    }
    
    try {
      console.log('[DEBUG] Map reference is available, updating view');
      
      // Delay before updating map view to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log('[DEBUG] Delayed map update running');
        
        try {
          if (!mapRef.current) return;
          
          // Force resize to ensure proper rendering
          mapRef.current.resize();
          console.log('[DEBUG] Map size updated successfully');
          
          // Set view to coordinates if available
          if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
            if (!isNaN(coordinates.lat) && !isNaN(coordinates.lon)) {
              console.log(`[DEBUG] Setting map view to: ${coordinates.lat}, ${coordinates.lon}`);
              mapRef.current.setCenter([coordinates.lon, coordinates.lat]);
              mapRef.current.setZoom(12);
            }
          }
          
          // Mark as updated
          if (!isUpdated.current && onMapReady && mapRef.current) {
            console.log('[DEBUG] Calling onMapReady callback');
            onMapReady(mapRef.current);
            isUpdated.current = true;
          }
        } catch (e) {
          console.error('[DEBUG] Error in MapboxMapUpdater timeout callback:', e);
        }
      }, 300);
      
      // Cleanup function
      return () => {
        console.log('[DEBUG] MapboxMapUpdater cleanup running');
        clearTimeout(timer);
      };
    } catch (e) {
      console.error('[DEBUG] Unexpected error in MapboxMapUpdater:', e);
    }
  }, [mapRef, coordinates, onMapReady]);

  return null;
}
