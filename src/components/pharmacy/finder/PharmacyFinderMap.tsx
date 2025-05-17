
import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';
import { getMapboxToken } from '@/services/mapbox';

console.log('PharmacyFinderMap component loaded');

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
  console.log('PharmacyFinderMap rendering with:', {
    pharmaciesCount: pharmacies?.length || 0,
    userLocation: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}` : 'null',
    useLocationFilter,
    pharmacyExample: pharmacies?.length > 0 ? `${pharmacies[0].name} at ${pharmacies[0].coordinates?.lat || 'unknown'}, ${pharmacies[0].coordinates?.lon || 'unknown'}` : 'No pharmacies'
  });
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mapInitAttempts, setMapInitAttempts] = useState(0);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const MAX_ATTEMPTS = 3;

  // Default center (Luxembourg)
  const defaultCenter: [number, number] = [6.1296, 49.8153];

  // Log when component mounts/unmounts
  useEffect(() => {
    console.log('PharmacyFinderMap mounted');
    return () => console.log('PharmacyFinderMap unmounted');
  }, []);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token');
        const token = await getMapboxToken();
        if (token) {
          console.log('Mapbox token received successfully');
          setMapboxToken(token);
          mapboxgl.accessToken = token;
        } else {
          throw new Error('Invalid token received');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError(new Error('Failed to load map resources'));
        
        // Try to use a fallback token
        try {
          console.log('Using fallback Mapbox token');
          const fallbackToken = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';
          mapboxgl.accessToken = fallbackToken;
          setMapboxToken(fallbackToken);
        } catch (fallbackErr) {
          console.error('Failed to set fallback token too:', fallbackErr);
        }
      }
    };
    
    fetchToken();
  }, []);
  
  // Update markers when pharmacies or user location changes
  const updateMarkers = useCallback(() => {
    if (!map.current || isLoading) {
      console.log('Cannot update markers: Map not ready or still loading');
      return;
    }
    
    try {
      console.log('Updating markers on map');
      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      if (userMarker.current) {
        userMarker.current.remove();
        userMarker.current = null;
      }
      
      // Add user location marker if available
      if (userLocation) {
        console.log('Adding user location marker at', [userLocation.lon, userLocation.lat]);
        const el = createUserMarker();
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([userLocation.lon, userLocation.lat] as [number, number])
          .addTo(map.current);
      }
      
      // Add pharmacy markers
      console.log(`Adding ${pharmacies.length} pharmacy markers`);
      let markersAdded = 0;
      
      pharmacies.forEach((pharmacy, index) => {
        if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) {
          console.log(`Pharmacy ${index} missing coordinates:`, pharmacy);
          return;
        }
        
        try {
          const el = createPharmacyMarker(pharmacy);
          const marker = new mapboxgl.Marker(el)
            .setLngLat([pharmacy.coordinates.lon, pharmacy.coordinates.lat] as [number, number])
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
          markersAdded++;
        } catch (err) {
          console.warn(`Error adding marker for pharmacy ${pharmacy.id}:`, err);
        }
      });
      
      console.log(`Successfully added ${markersAdded} pharmacy markers`);
      
      // If no pharmacies to display or no user location
      if (markers.current.length === 0 && !userMarker.current) {
        // Set default view of Luxembourg
        console.log('No markers or user location, setting default center view');
        map.current.setCenter(defaultCenter);
        map.current.setZoom(10);
        return;
      }
      
      // Fit map bounds to include all markers and user location
      if (markers.current.length > 0 || userMarker.current) {
        console.log('Fitting map to bounds of markers');
        const bounds = new mapboxgl.LngLatBounds();
        
        // Include user location in bounds if available
        if (userLocation) {
          bounds.extend([userLocation.lon, userLocation.lat] as [number, number]);
        }
        
        // Include all pharmacy markers in bounds
        markers.current.forEach(marker => {
          bounds.extend(marker.getLngLat());
        });
        
        if (!bounds.isEmpty()) {
          console.log('Adjusting map bounds to fit all markers');
          // Apply bounds with padding
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14
          });
        } else {
          // If bounds are empty, set default view
          console.log('Bounds empty, using default center');
          map.current.setCenter(defaultCenter);
          map.current.setZoom(10);
        }
      }
    } catch (err) {
      console.error("Error updating markers:", err);
    }
  }, [pharmacies, userLocation, isLoading, defaultCenter]);

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainer.current || mapInitialized || !mapboxToken) {
      console.log('Map initialization conditions not met:', {
        containerExists: !!mapContainer.current,
        alreadyInitialized: mapInitialized, 
        hasToken: !!mapboxToken
      });
      return;
    }
    
    let isMounted = true;
    console.log('Initializing Mapbox map');
    
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        console.log('Map initialization starting', { token: mapboxToken ? 'exists' : 'missing' });
        console.log('Container dimensions:', {
          width: mapContainer.current?.offsetWidth,
          height: mapContainer.current?.offsetHeight
        });
        
        // Initialize map
        if (!map.current && mapContainer.current) {
          const center = userLocation 
            ? [userLocation.lon, userLocation.lat] as [number, number]
            : defaultCenter;
          
          console.log('Creating map with center:', center);
          
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center,
            zoom: 12,
            attributionControl: true,
            trackResize: true,
            failIfMajorPerformanceCaveat: false
          });
          
          console.log('Mapbox map instance created');
          
          // Add navigation controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Wait for map to load
          map.current.on('load', () => {
            if (isMounted) {
              console.log("Map loaded successfully");
              setIsLoading(false);
              setMapInitialized(true);
              
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
            console.log('Will retry map initialization');
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
        console.log('Cleaning up Mapbox map');
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapInitAttempts, userLocation, defaultCenter, updateMarkers, mapInitialized, mapboxToken]);

  // Effect to update markers when pharmacies or user location changes
  useEffect(() => {
    if (map.current && !isLoading && mapInitialized) {
      console.log('Triggering marker update due to pharmacies or location change');
      updateMarkers();
    }
  }, [pharmacies, userLocation, isLoading, updateMarkers, mapInitialized]);

  // Handle retry when map fails to load
  const handleRetry = () => {
    console.log('Retrying map initialization');
    setError(null);
    setMapInitAttempts(0);
    setIsLoading(true);
    setMapInitialized(false);
  };

  if (isLoading) {
    console.log('Showing loading skeleton for map');
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-full h-[500px]" />
          <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Showing error state for map:', error.message);
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

  console.log('Rendering final map container div');

  return (
    <div className="w-full h-full min-h-[500px] relative border border-gray-200 rounded-lg overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-full absolute inset-0 rounded-lg"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};
