
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { MapPin, Map as MapIcon, Navigation, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMapboxToken } from '@/services/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/use-toast';
import { LocalCache } from '@/lib/cache';

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
  const [hasRendered, setHasRendered] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const tokenErrorRetryCount = useRef(0);
  
  // Pass all pharmacies to parent on mount
  useEffect(() => {
    console.log('InteractiveMapComponent: Passing pharmacies to parent:', pharmacies.length);
    onPharmaciesInShape(pharmacies);
  }, [pharmacies, onPharmaciesInShape]);

  // Set rendered flag after first render
  useEffect(() => {
    setHasRendered(true);
  }, []);
  
  // Get Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('Fetching Mapbox token...');
        const token = await getMapboxToken();
        
        if (token) {
          console.log('Received token:', token ? 'Valid token' : 'No token');
          setMapboxToken(token);
          mapboxgl.accessToken = token;
        } else {
          throw new Error('Invalid token received');
        }
      } catch (error) {
        console.error('Error setting Mapbox token:', error);
        setMapError('Failed to load map resources');
        
        // Always set a fallback token
        const fallbackToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
        console.log('Using fallback token');
        setMapboxToken(fallbackToken);
        mapboxgl.accessToken = fallbackToken;
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Initialize Mapbox map with improved error handling
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapContainer.current || mapInitializedRef.current) return;
      
      try {
        setIsLoading(true);
        setMapError(null);
        
        // Get Mapbox token with retry mechanism
        const getTokenWithRetry = async (retries = 2): Promise<string> => {
          try {
            const token = await getMapboxToken();
            if (!token) throw new Error("Failed to get Mapbox token");
            return token;
          } catch (err) {
            if (retries > 0) {
              console.log(`Retrying token fetch, ${retries} attempts left`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return getTokenWithRetry(retries - 1);
            }
            throw err;
          }
        };

        const token = await getTokenWithRetry();
        mapboxgl.accessToken = token;
        
        // Set default center based on user location or fallback to Luxembourg
        const defaultCenter: [number, number] = userLocation 
          ? [userLocation.lon, userLocation.lat] 
          : [6.1296, 49.8153];
        
        // Create the map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12', // Updated to a more recent style
          center: defaultCenter,
          zoom: 12,
          attributionControl: false
        });
        
        // Add navigation control (zoom buttons)
        map.current.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'top-right'
        );
        
        // Initialize markers when the map loads
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setIsLoading(false);
          setIsMapLoaded(true);
          mapInitializedRef.current = true;
          updateMarkers();
        });
        
        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Map error:', e);
          
          // Check if error is related to token or style
          if (e.error && (
            e.error.message?.includes('access token') || 
            e.error.message?.includes('Unauthorized') ||
            e.error.message?.includes('401')
          )) {
            // Clear token from cache to force a refresh on retry
            if (LocalCache.delete) {
              LocalCache.delete('mapbox-token');
            }
            
            if (tokenErrorRetryCount.current < 2) {
              tokenErrorRetryCount.current += 1;
              console.log(`Token error, retrying (${tokenErrorRetryCount.current}/2)`);
              
              // Clean up current map instance
              if (map.current) {
                map.current.remove();
                map.current = null;
              }
              
              // Reset initialization flag to allow retrying
              mapInitializedRef.current = false;
              
              // Retry initialization after a delay
              setTimeout(() => {
                initializeMap();
              }, 1500);
              
              return;
            }
          }
          
          setMapError('Error loading map - Please try refreshing the page');
        });
        
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map - Please check your network connection');
        setIsLoading(false);
      }
    };
    
    initializeMap();
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      mapInitializedRef.current = false;
    };
  }, [userLocation]);
  
  const mapInitializedRef = useRef(false);
  
  // Update markers when pharmacies or user location changes
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapInitializedRef.current) return;
    
    // Clear existing pharmacy markers
    pharmacyMarkers.current.forEach(marker => marker.remove());
    pharmacyMarkers.current = [];
    
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
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your location'))
        .addTo(map.current);
    }
    
    // Add pharmacy markers
    pharmacies.forEach(pharmacy => {
      if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return;
      
      try {
        const pharmLat = parseFloat(pharmacy.coordinates.lat.toString());
        const pharmLon = parseFloat(pharmacy.coordinates.lon.toString());
        
        if (isNaN(pharmLat) || isNaN(pharmLon)) return;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'pharmacy-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundImage = 'url("https://cdn0.iconfinder.com/data/icons/medical-services-2/256/Drugstore-512.png")';
        el.style.backgroundSize = 'contain';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.cursor = 'pointer';
        
        // Create popup but don't attach it immediately
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${pharmacy.name || 'Pharmacy'}</h3>
              <p class="text-xs text-gray-600">${pharmacy.address || 'No address'}</p>
              ${pharmacy.distance ? `<p class="text-xs font-medium mt-1">Distance: ${pharmacy.distance} km</p>` : ''}
            </div>
          `);
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([pharmLon, pharmLat])
          .addTo(map.current!);
        
        // Only show popup on hover
        el.addEventListener('mouseenter', () => {
          marker.setPopup(popup).togglePopup();
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
    });
  }, [pharmacies, userLocation]);
  
  // Update markers when pharmacies or user location changes
  useEffect(() => {
    updateMarkers();
  }, [pharmacies, userLocation, updateMarkers]);
  
  // Fly to user location when it changes
  useEffect(() => {
    if (!map.current || !userLocation || !mapInitializedRef.current) return;
    
    map.current.flyTo({
      center: [userLocation.lon, userLocation.lat] as [number, number],
      zoom: 13,
      essential: true
    });
  }, [userLocation]);
  
  // Show toast notification for map errors
  useEffect(() => {
    if (mapError) {
      toast({
        title: "Map Error",
        description: mapError,
        variant: "destructive",
      });
    }
  }, [mapError]);

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
                <p className="text-sm text-gray-600">{mapError}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setMapError(null);
                    mapInitializedRef.current = false;
                    tokenErrorRetryCount.current = 0;
                    
                    // Clear token from cache to force a refresh
                    try {
                      if (LocalCache.delete) {
                        LocalCache.delete('mapbox-token');
                      }
                    } catch (e) {
                      console.error('Error clearing token cache:', e);
                    }
                    
                    if (map.current) {
                      map.current.remove();
                      map.current = null;
                    }
                    
                    // Force component re-render
                    setIsLoading(true);
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Pharmacy list overlay */}
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
