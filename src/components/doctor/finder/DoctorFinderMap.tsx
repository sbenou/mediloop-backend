
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Map as MapIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMapboxToken } from '@/services/mapbox';
import { LocalCache } from '@/lib/cache';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from '@/components/ui/use-toast';
import type { Doctor } from '@/lib/types/overpass.types';

interface DoctorFinderMapProps {
  doctors: Doctor[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
  onDoctorSelect: (doctorId: string, source?: string) => void;
}

/**
 * An interactive map component that visually displays doctors using Mapbox GL
 */
export const DoctorFinderMap: React.FC<DoctorFinderMapProps> = ({
  doctors,
  userLocation,
  useLocationFilter,
  onDoctorSelect
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDoctor, setHoveredDoctor] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const doctorMarkers = useRef<mapboxgl.Marker[]>([]);
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track map initialization status
  const mapInitialized = useRef(false);

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

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapInitialized.current) {
      return;
    }
    
    const initializeMap = () => {
      try {
        setIsLoading(true);
        setMapError(null);
        
        console.log('Initializing map with token:', mapboxToken);
        
        // Set default center based on user location or fallback to Luxembourg
        const defaultCenter: [number, number] = userLocation 
          ? [userLocation.lon, userLocation.lat] 
          : [6.1296, 49.8153];
        
        // Create map with basic options
        const mapOptions: mapboxgl.MapOptions = {
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: defaultCenter,
          zoom: 12,
          attributionControl: false,
          trackResize: true,
          minZoom: 2,
          cooperativeGestures: true,
        };

        try {
          const mapInstance = new mapboxgl.Map(mapOptions);
          map.current = mapInstance;
          
          mapInstance.once('load', () => {
            console.log('Map loaded successfully');
            setIsLoading(false);
            setIsMapLoaded(true);
            mapInitialized.current = true;
            
            mapInstance.addControl(
              new mapboxgl.NavigationControl({ showCompass: false }),
              'top-right'
            );
            
            mapInstance.dragRotate.disable();
            mapInstance.touchZoomRotate.disableRotation();
            
            updateMarkers();
          });
          
          mapInstance.on('error', (e) => {
            console.error('Map error:', e);
            
            const errorMsg = e.error ? e.error.message || '' : '';
            const isCorsError = errorMsg.includes('CORS') || errorMsg.includes('cross-origin');
            const isWebGLError = errorMsg.includes('WebGL') || errorMsg.includes('context');
            
            if (isCorsError || isWebGLError) {
              console.warn('Non-fatal map error (continuing):', errorMsg);
              return;
            }
            
            if (retryCount < 2) {
              const newRetryCount = retryCount + 1;
              setRetryCount(newRetryCount);
              
              try {
                mapInstance.remove();
              } catch (err) {
                console.error('Error removing map during error handling:', err);
              }
              
              map.current = null;
              mapInitialized.current = false;
              
              try {
                LocalCache.delete('mapbox-token');
                console.log('Cleared mapbox token from cache');
              } catch (err) {
                console.error('Unable to clear token from cache:', err);
              }
              
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
          
        } catch (mapInitError) {
          console.error('Error creating map instance:', mapInitError);
          setMapError('Failed to create map - Please try again');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map - Please check your network connection');
        setIsLoading(false);
      }
    };
    
    initializeMap();

    return () => {
      if (map.current) {
        try {
          if (map.current.off) {
            map.current.off('load', null);
            map.current.off('error', null);
          }
          map.current.remove();
          map.current = null;
        } catch (error) {
          console.error('Error during map cleanup:', error);
        }
      }
    };
  }, [mapboxToken, userLocation, retryCount]);
  
  // Update markers when doctors or user location changes
  const updateMarkers = useCallback(() => {
    if (!map.current || !map.current.loaded()) {
      return;
    }
    
    // Clear existing doctor markers
    while (doctorMarkers.current.length > 0) {
      const marker = doctorMarkers.current.pop();
      if (marker) marker.remove();
    }
    
    // Clear user location marker
    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
      userLocationMarker.current = null;
    }
    
    // Add user location marker if available
    if (userLocation) {
      const userEl = document.createElement('div');
      userEl.className = 'user-location-marker';
      userEl.style.width = '20px';
      userEl.style.height = '20px';
      userEl.style.borderRadius = '50%';
      userEl.style.backgroundColor = '#3b82f6';
      userEl.style.border = '2px solid white';
      userEl.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';
      
      try {
        userLocationMarker.current = new mapboxgl.Marker(userEl)
          .setLngLat([userLocation.lon, userLocation.lat])
          .addTo(map.current);
      } catch (err) {
        console.error("Error adding user marker:", err);
      }
    }
    
    // Add doctor markers
    for (const doctor of doctors) {
      if (!doctor.coordinates?.lat || !doctor.coordinates?.lon) continue;
      
      try {
        const doctorLat = parseFloat(doctor.coordinates.lat.toString());
        const doctorLon = parseFloat(doctor.coordinates.lon.toString());
        
        if (isNaN(doctorLat) || isNaN(doctorLon)) continue;
        
        // Create doctor marker element
        const el = document.createElement('div');
        el.className = 'doctor-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundColor = '#10b981';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        // Create popup content
        const popupHTML = `
          <div class="p-2">
            <h3 class="font-semibold">${doctor.full_name || 'Doctor'}</h3>
            <p class="text-xs text-gray-600">${(doctor.address || doctor.city) || 'No address'}</p>
            ${doctor.distance !== undefined ? `<p class="text-xs font-medium mt-1">Distance: ${typeof doctor.distance === 'number' ? `${doctor.distance.toFixed(1)} km` : doctor.distance}</p>` : ''}
            <button class="w-full mt-2 bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 flex items-center justify-center gap-2" onclick="window.connectDoctor('${doctor.id}', '${doctor.source || 'database'}')">
              Connect
            </button>
          </div>
        `;
        
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: false,
          maxWidth: '300px'
        }).setHTML(popupHTML);
        
        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([doctorLon, doctorLat])
          .addTo(map.current);
        
        // Event handlers
        el.addEventListener('mouseenter', () => {
          try {
            marker.setPopup(popup);
            popup.addTo(map.current!);
            setHoveredDoctor(doctor.id);
          } catch (err) {
            console.error("Error showing popup:", err);
          }
        });
        
        el.addEventListener('mouseleave', () => {
          try {
            popup.remove();
            setHoveredDoctor(null);
          } catch (err) {
            console.error("Error removing popup:", err);
          }
        });
        
        el.addEventListener('click', () => {
          onDoctorSelect(doctor.id, doctor.source);
        });
        
        doctorMarkers.current.push(marker);
      } catch (error) {
        console.error('Error adding doctor marker:', error);
      }
    }

    // Set up global connect function for popup buttons
    (window as any).connectDoctor = (doctorId: string, source: string) => {
      onDoctorSelect(doctorId, source);
    };
  }, [doctors, userLocation, onDoctorSelect]);
  
  // Update markers when data changes
  useEffect(() => {
    if (isMapLoaded && map.current) {
      updateMarkers();
    }
  }, [doctors, userLocation, isMapLoaded, updateMarkers]);
  
  // Fly to user location when it changes
  useEffect(() => {
    if (!map.current || !userLocation || !mapInitialized.current || !isMapLoaded) return;
    
    try {
      map.current.flyTo({
        center: [userLocation.lon, userLocation.lat],
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
    
    try {
      LocalCache.delete('mapbox-token');
      console.log('Cleared mapbox token from cache');
    } catch (e) {
      console.error('Error clearing token cache:', e);
    }
    
    if (map.current) {
      try {
        if (map.current.off) {
          map.current.off('load', null);
          map.current.off('error', null);
        }
        map.current.remove();
      } catch (e) {
        console.error('Error removing map:', e);
      }
      map.current = null;
    }
    
    mapInitialized.current = false;
    
    getMapboxToken().then(newToken => {
      if (newToken) {
        setMapboxToken(newToken);
        mapboxgl.accessToken = newToken;
      }
    });
  };

  return (
    <Card className="overflow-hidden h-full border border-gray-200 rounded-md">
      <CardContent className="p-0 h-full relative">
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
        
        {/* Doctor count overlay */}
        <div className="absolute top-3 left-3 max-w-[200px] z-30 bg-white/95 backdrop-blur-sm p-2 rounded-md shadow-sm">
          <h3 className="text-sm font-medium mb-1 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            Doctors
          </h3>
          <p className="text-xs text-gray-600 mb-1">{doctors.length} doctors available</p>
        </div>
      </CardContent>
    </Card>
  );
};
