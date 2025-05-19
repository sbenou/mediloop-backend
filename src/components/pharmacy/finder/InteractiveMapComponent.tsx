
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Map as MapIcon, Navigation, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMapboxToken } from '@/services/mapbox';
import { LocalCache } from '@/lib/cache';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/use-toast';

interface Pharmacy {
  id: string;
  name: string;
  address?: string;
  coordinates?: { lat: number | string; lon: number | string } | null;
  distance?: string;
  [key: string]: any; // Allow for other pharmacy properties
}

interface InteractiveMapComponentProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  onPharmaciesInShape: (pharmacies: Pharmacy[]) => void;
}

/**
 * An interactive map component that visually displays pharmacies using Mapbox GL
 */
const InteractiveMapComponent: React.FC<InteractiveMapComponentProps> = ({
  pharmacies,
  userLocation,
  onPharmaciesInShape
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPharmacy, setHoveredPharmacy] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const pharmacyMarkers = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track map initialization status
  const mapInitialized = useRef(false);
  
  // Pass all pharmacies to parent on mount
  useEffect(() => {
    console.log('InteractiveMapComponent: Passing pharmacies to parent:', pharmacies.length);
    onPharmaciesInShape(pharmacies);

    // Make sure we clean up the map instance on unmount
    return () => {
      if (map.current) {
        // Remove event listeners
        map.current.off();
        // Destroy map instance
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Get Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('Fetching Mapbox token...');
        const token = await getMapboxToken();
        
        if (token) {
          console.log('Received Mapbox token successfully');
          setMapboxToken(token);
          mapboxgl.accessToken = token;
        } else {
          throw new Error('Invalid token received');
        }
      } catch (error) {
        console.error('Error setting Mapbox token:', error);
        setMapError('Failed to load map resources. Please retry.');
        
        // Set a fallback token
        const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        console.log('Using fallback token');
        setMapboxToken(fallbackToken);
        mapboxgl.accessToken = fallbackToken;
      }
    };
    
    if (!mapboxToken) {
      fetchMapboxToken();
    }
  }, []);

  // Initialize Mapbox map with improved error handling
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapInitialized.current) {
      return;
    }
    
    // Create a local function to handle map initialization
    // This prevents any closures from capturing non-cloneable objects
    const initializeMap = () => {
      try {
        setIsLoading(true);
        setMapError(null);
        
        console.log('Initializing map with token:', mapboxToken);
        
        // Set default center based on user location or fallback to Luxembourg
        const defaultCenter: [number, number] = userLocation 
          ? [userLocation.lon, userLocation.lat] 
          : [6.1296, 49.8153];
        
        // Create map with basic options first using a safer approach
        const mapOptions: mapboxgl.MapOptions = {
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: defaultCenter,
          zoom: 12,
          attributionControl: false,
          trackResize: true,
          minZoom: 2,
          preserveDrawingBuffer: true // This helps with some cloning issues
        };

        const mapInstance = new mapboxgl.Map(mapOptions);
        map.current = mapInstance;
        
        // Use safer event binding
        mapInstance.once('load', () => {
          console.log('Map loaded successfully');
          setIsLoading(false);
          setIsMapLoaded(true);
          mapInitialized.current = true;
          
          // Add navigation control after map is loaded
          mapInstance.addControl(
            new mapboxgl.NavigationControl({ showCompass: false }),
            'top-right'
          );
          
          updateMarkers();
        });
        
        // Handle map errors with a safer approach
        mapInstance.on('error', (e) => {
          console.error('Map error:', e);
          
          if (retryCount < 2) {
            // Increment retry count but don't trigger a re-render immediately
            const newRetryCount = retryCount + 1;
            setRetryCount(newRetryCount);
            
            // Clean up current map instance
            if (mapInstance) {
              mapInstance.remove();
            }
            map.current = null;
            mapInitialized.current = false;
            
            // Try to clear token from cache
            try {
              LocalCache.delete('mapbox-token', true);
            } catch (err) {
              console.error('Unable to clear token from cache:', err);
            }
            
            // Try again with a delay
            setTimeout(() => {
              getMapboxToken().then(newToken => {
                if (newToken) {
                  setMapboxToken(newToken);
                  mapboxgl.accessToken = newToken;
                }
              });
            }, 1000);
          } else {
            setMapError('Error loading map - Please try refreshing the page');
          }
        });
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map - Please check your network connection');
        setIsLoading(false);
      }
    };
    
    initializeMap();
  }, [mapboxToken, userLocation, retryCount]);
  
  // Update markers when pharmacies or user location changes
  const updateMarkers = useCallback(() => {
    // Use a safer check to see if we can update markers
    if (!map.current || !map.current.loaded()) {
      return;
    }
    
    // Clear existing pharmacy markers
    while (pharmacyMarkers.current.length > 0) {
      pharmacyMarkers.current.pop()?.remove();
    }
    
    // Clear user location marker
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
      userLocationMarker.current = null;
    }
    
    // Add user location marker if available
    if (userLocation) {
      // Create a custom element for user location
      const userEl = document.createElement('div');
      userEl.className = 'user-location-marker';
      userEl.style.width = '20px';
      userEl.style.height = '20px';
      userEl.style.borderRadius = '50%';
      userEl.style.backgroundColor = '#3b82f6';
      userEl.style.border = '2px solid white';
      userEl.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';
      
      userLocationMarker.current = new mapboxgl.Marker(userEl)
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(map.current);
    }
    
    // Add pharmacy markers
    for (const pharmacy of pharmacies) {
      if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) continue;
      
      try {
        const pharmLat = parseFloat(pharmacy.coordinates.lat.toString());
        const pharmLon = parseFloat(pharmacy.coordinates.lon.toString());
        
        if (isNaN(pharmLat) || isNaN(pharmLon)) continue;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'pharmacy-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundImage = 'url("https://cdn0.iconfinder.com/data/icons/medical-services-2/256/Drugstore-512.png")';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.cursor = 'pointer';
        
        // Create popup content
        const popupHTML = `
          <div class="p-2">
            <h3 class="font-semibold">${pharmacy.name || 'Pharmacy'}</h3>
            <p class="text-xs text-gray-600">${pharmacy.address || 'No address'}</p>
            ${pharmacy.distance ? `<p class="text-xs font-medium mt-1">Distance: ${pharmacy.distance} km</p>` : ''}
          </div>
        `;
        
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          maxWidth: '300px'
        }).setHTML(popupHTML);
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([pharmLon, pharmLat])
          .addTo(map.current!);
        
        // Only attach events if map is fully loaded
        el.addEventListener('mouseenter', () => {
          marker.setPopup(popup);
          popup.addTo(map.current!);
          setHoveredPharmacy(pharmacy.id);
        });
        
        el.addEventListener('mouseleave', () => {
          popup.remove();
          setHoveredPharmacy(null);
        });
        
        // Track all markers for later cleanup
        pharmacyMarkers.current.push(marker);
      } catch (error) {
        console.error('Error adding pharmacy marker:', error);
      }
    }
  }, [pharmacies, userLocation]);
  
  // Update markers when pharmacies or user location changes
  useEffect(() => {
    if (isMapLoaded && map.current) {
      updateMarkers();
    }
  }, [pharmacies, userLocation, isMapLoaded, updateMarkers]);
  
  // Fly to user location when it changes
  useEffect(() => {
    if (!map.current || !userLocation || !mapInitialized.current || !isMapLoaded) return;
    
    // Use try/catch to handle potential errors in map operations
    try {
      map.current.flyTo({
        center: [userLocation.lon, userLocation.lat] as [number, number],
        zoom: 13,
        essential: true
      });
    } catch (error) {
      console.error("Error flying to user location:", error);
    }
  }, [userLocation, isMapLoaded]);
  
  // Handle retry button click
  const handleRetry = () => {
    setMapError(null);
    setIsLoading(true);
    setRetryCount(0);
    
    // Try to clear token from cache
    try {
      LocalCache.delete('mapbox-token', true);
    } catch (e) {
      console.error('Error clearing token cache:', e);
    }
    
    // Clean up existing map
    if (map.current) {
      try {
        // Remove all listeners
        map.current.off();
        // Then remove the map
        map.current.remove();
      } catch (e) {
        console.error('Error removing map:', e);
      }
      map.current = null;
    }
    
    // Reset initialization flag
    mapInitialized.current = false;
    
    // Get a new token and retry
    getMapboxToken().then(newToken => {
      if (newToken) {
        setMapboxToken(newToken);
        mapboxgl.accessToken = newToken;
      }
    });
  };

  // Render the component
  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
        {/* Map container */}
        <div 
          ref={mapContainer} 
          className="w-full h-full relative"
          style={{ minHeight: '500px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <MapIcon className="h-10 w-10 text-primary/60 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center p-4 max-w-md">
                <MapIcon className="h-10 w-10 text-red-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-2">Map Error</h3>
                <p className="text-sm text-gray-600 mb-4">{mapError}</p>
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading Map
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Pharmacy count overlay */}
        <div className="absolute top-3 left-3 max-w-[200px] z-30 bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-sm">
          <h3 className="text-sm font-medium mb-1 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            Pharmacies
          </h3>
          <p className="text-xs text-gray-600 mb-1">{pharmacies.length} pharmacies available</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMapComponent;
