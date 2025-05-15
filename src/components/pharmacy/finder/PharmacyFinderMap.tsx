
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';
import { getMapboxToken } from '@/services/mapbox';

// Create custom HTML marker for pharmacy locations
const createPharmacyMarker = (pharmacy: Pharmacy) => {
  const el = document.createElement('div');
  el.className = 'pharmacy-marker';
  el.style.backgroundImage = "url(https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png)";
  el.style.backgroundSize = 'contain';
  el.style.width = '25px';
  el.style.height = '41px';
  el.style.backgroundRepeat = 'no-repeat';
  
  return el;
};

// Create custom HTML marker for user location
const createUserMarker = () => {
  const el = document.createElement('div');
  el.className = 'user-location-marker';
  el.style.width = '15px';
  el.style.height = '15px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = '#3b82f6';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.2)';
  
  return el;
};

interface PharmacyFinderMapProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
}

export const PharmacyFinderMap: React.FC<PharmacyFinderMapProps> = ({ 
  pharmacies, 
  userLocation, 
  useLocationFilter 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mapInitAttempts, setMapInitAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  // Default center (Luxembourg)
  const defaultCenter: [number, number] = [6.1296, 49.8153];

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current) return;
    
    let isMounted = true;
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        
        // Get Mapbox token
        const token = await getMapboxToken();
        if (!token) throw new Error("Could not retrieve Mapbox token");
        
        mapboxgl.accessToken = token;
        
        // Initialize map
        if (!map.current && mapContainer.current) {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: userLocation ? [userLocation.lon, userLocation.lat] : defaultCenter,
            zoom: 12,
            attributionControl: true,
            trackResize: true,
            failIfMajorPerformanceCaveat: false,
            cooperativeGestures: true // Better handling for mobile
          });
          
          // Add navigation controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Wait for map to load
          map.current.on('load', () => {
            if (isMounted) {
              setIsLoading(false);
              
              // Update markers when map is ready
              updateMarkers();
            }
          });
          
          // Handle map errors
          map.current.on('error', (e) => {
            console.error('Mapbox error:', e);
            if (isMounted) {
              setError(new Error('Failed to load map resources'));
              setIsLoading(false);
            }
          });
        }
      } catch (err) {
        console.error("Error initializing map:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize map'));
          setIsLoading(false);
          
          // Try to recover if under max attempts
          if (mapInitAttempts < MAX_ATTEMPTS) {
            setMapInitAttempts(prev => prev + 1);
            setTimeout(initializeMap, 1000);
          }
        }
      }
    };
    
    initializeMap();
    
    return () => {
      isMounted = false;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapInitAttempts, userLocation]);

  // Update markers when pharmacies or user location changes
  const updateMarkers = () => {
    if (!map.current || isLoading) return;
    
    try {
      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }
      
      // Add user location marker if available
      if (userLocation) {
        const el = createUserMarker();
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([userLocation.lon, userLocation.lat])
          .addTo(map.current);
      }
      
      // Add pharmacy markers
      pharmacies.forEach(pharmacy => {
        if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return;
        
        try {
          const el = createPharmacyMarker(pharmacy);
          const marker = new mapboxgl.Marker(el)
            .setLngLat([pharmacy.coordinates.lon, pharmacy.coordinates.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="max-width: 200px;">
                  <h3 style="font-weight: bold; margin-bottom: 5px;">${pharmacy.name || 'Pharmacy'}</h3>
                  <p style="font-size: 0.9em;">${pharmacy.address || 'Address unavailable'}</p>
                  ${pharmacy.hours ? `<p style="font-size: 0.8em; margin-top: 5px;">Hours: ${pharmacy.hours}</p>` : ''}
                </div>
              `))
            .addTo(map.current);
            
          markers.current.push(marker);
        } catch (err) {
          console.warn(`Error adding marker for pharmacy ${pharmacy.id}:`, err);
        }
      });
      
      // If no pharmacies to display or no user location
      if (markers.current.length === 0 && !userMarker.current) {
        // Set default view of Luxembourg
        map.current.setCenter(defaultCenter);
        map.current.setZoom(10);
        return;
      }
      
      // Fit map bounds to include all markers and user location
      if (markers.current.length > 0 || userMarker.current) {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Include user location in bounds if available
        if (userLocation) {
          bounds.extend([userLocation.lon, userLocation.lat]);
        }
        
        // Include all pharmacy markers in bounds
        markers.current.forEach(marker => {
          bounds.extend(marker.getLngLat());
        });
        
        if (bounds.isEmpty()) {
          // If bounds are empty, set default view
          map.current.setCenter(defaultCenter);
          map.current.setZoom(10);
        } else {
          // Apply bounds with padding
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14
          });
        }
      }
    } catch (err) {
      console.error("Error updating markers:", err);
    }
  };

  // Effect to update markers when pharmacies or user location changes
  useEffect(() => {
    updateMarkers();
  }, [pharmacies, userLocation, isLoading, useLocationFilter]);

  // Handle retry when map fails to load
  const handleRetry = () => {
    setError(null);
    setMapInitAttempts(0);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[500px]">
        <Skeleton className="w-full h-full min-h-[500px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-gray-100 rounded-lg">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h3 className="text-lg font-semibold text-red-500 mb-3">Map Loading Error</h3>
          <p className="text-muted-foreground mb-4">
            {error.message || 'Failed to load the map. Please try again or check your connection.'}
          </p>
          <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry Loading Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px] relative">
      <div 
        ref={mapContainer} 
        className="w-full h-full absolute inset-0 rounded-lg"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};
