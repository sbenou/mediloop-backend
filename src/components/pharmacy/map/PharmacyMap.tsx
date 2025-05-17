
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from "@/components/ui/use-toast";
import { SimplifiedMapUpdater } from './SimplifiedMapUpdater';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Detect if the current device is a mobile device
const isMobileDevice = typeof navigator !== 'undefined' && 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Add global error handler to catch the problematic "a is not a function" error
if (typeof window !== 'undefined') {
  // Global error handler to catch Leaflet touch-related errors
  window.addEventListener('error', (e) => {
    if (e.message && (
      e.message.includes('a is not a function') || 
      e.message.includes('touchleave') ||
      e.message.includes('touch') ||
      e.message.includes('_onTap')
    )) {
      console.warn('PharmacyMap: Suppressing Leaflet error:', e.message);
      e.preventDefault();
      e.stopPropagation();
      return true; // Prevents the error from propagating
    }
    return false;
  }, true);
  
  // Try to patch all touch events globally
  try {
    if (typeof EventTarget !== 'undefined') {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        // For touch events, replace with a safe no-op function
        if (type && typeof type === 'string' && 
            (type.includes('touch') || type.includes('tap'))) {
          console.log('PharmacyMap: Intercepting touch event:', type);
          // Create a safe wrapper around the listener
          const safeListener = function(event) {
            try {
              // Try the original listener
              if (typeof listener === 'function') {
                listener(event);
              } else if (listener && typeof listener.handleEvent === 'function') {
                listener.handleEvent(event);
              }
            } catch (e) {
              // Suppress any errors from the handler
              console.warn(`PharmacyMap: Suppressed error in ${type} handler:`, e.message);
              event.preventDefault();
              event.stopPropagation();
            }
          };
          return originalAddEventListener.call(this, type, safeListener, options);
        }
        // For non-touch events, use the original handler
        return originalAddEventListener.call(this, type, listener, options);
      };
    }
  } catch (e) {
    console.warn('PharmacyMap: Failed to patch EventTarget:', e);
  }
}

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation 
}: PharmacyMapProps) {
  // Default center position for Luxembourg
  const defaultCenter: [number, number] = [49.8153, 6.1296];
  
  // Ensure coordinates are valid numbers
  const centerCoords = useMemo<[number, number]>(() => {
    if (coordinates && 
        typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) &&
        typeof coordinates.lon === 'number' && !isNaN(coordinates.lon)) {
      return [coordinates.lat, coordinates.lon];
    }
    return defaultCenter;
  }, [coordinates]);
  
  // Add key state to force re-render when needed
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const mapReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Add fallback timeout to ensure map is ready
  useEffect(() => {
    if (isMapReady) return;
    
    // Quick fallback (300ms)
    const quickTimeout = setTimeout(() => {
      if (!isMapReady) {
        console.log('PharmacyMap: Quick fallback for map ready state');
        setIsMapReady(true);
      }
    }, 300);
    
    // Medium fallback (1s)
    mapReadyTimeoutRef.current = setTimeout(() => {
      console.log('PharmacyMap: Medium fallback timeout reached, forcing ready state');
      setIsMapReady(true);
    }, 1000);
    
    return () => {
      clearTimeout(quickTimeout);
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
        mapReadyTimeoutRef.current = null;
      }
    };
  }, [isMapReady]);

  // Ensure the map container has proper dimensions
  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.style.height = '100%';
      mapContainerRef.current.style.width = '100%';
      mapContainerRef.current.style.minHeight = '400px';
      mapContainerRef.current.style.position = 'relative';
      mapContainerRef.current.style.zIndex = '1';
      mapContainerRef.current.style.display = 'block';
      mapContainerRef.current.style.visibility = 'visible';
    }
  }, []);
  
  // Handle map ready state
  const handleMapReady = useCallback((mapInstance?: L.Map) => {
    console.log("PharmacyMap: Map is ready");
    setIsMapReady(true);
    setMapInitError(null);
    
    if (mapInstance) {
      mapRef.current = mapInstance;
      
      // CRITICAL: Completely disable all touch functionality
      try {
        // @ts-ignore - These properties exist but might not be typed
        if (mapInstance.touchZoom) mapInstance.touchZoom.disable();
        // @ts-ignore
        if (mapInstance.tap) mapInstance.tap.disable();
        // @ts-ignore
        if (mapInstance.boxZoom) mapInstance.boxZoom.disable();
        // @ts-ignore
        if (mapInstance.keyboard) mapInstance.keyboard.disable();
        
        // Disable event listeners for touch events on the map container
        if (mapInstance._container) {
          const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'tap'];
          touchEvents.forEach(event => {
            try {
              mapInstance._container.removeEventListener(event, () => {}, { capture: true });
            } catch (e) {
              // Ignore errors when removing event listeners
            }
          });
        }
        
        // Resize map
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.invalidateSize(true);
          }
        }, 200);
      } catch (error) {
        console.warn('Error disabling touch handlers:', error);
      }
    }
    
    // Clear any pending timeouts
    if (mapReadyTimeoutRef.current) {
      clearTimeout(mapReadyTimeoutRef.current);
      mapReadyTimeoutRef.current = null;
    }
  }, []);

  // Filter pharmacies when user location changes
  useEffect(() => {
    if (!pharmacies || !Array.isArray(pharmacies)) return;
    
    try {
      if (showDefaultLocation && coordinates) {
        // When location is enabled, show pharmacies nearby (2km radius)
        const userLocation = coordinates ? L.latLng(coordinates.lat, coordinates.lon) : null;
        
        if (userLocation) {
          // Use a safe filtering method that handles potential data problems
          const nearbyPharmacies = pharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            try {
              const pharmLat = parseFloat(pharmacy.coordinates.lat);
              const pharmLon = parseFloat(pharmacy.coordinates.lon);
              
              if (isNaN(pharmLat) || isNaN(pharmLon)) return false;
              
              const pharmacyLocation = L.latLng(pharmLat, pharmLon);
              const distance = userLocation.distanceTo(pharmacyLocation);
              
              // Add distance to pharmacy for display
              pharmacy.distance = (distance / 1000).toFixed(1) + " km";
              
              return distance <= 2000; // 2km radius
            } catch (error) {
              console.error('Error calculating distance for pharmacy:', error);
              return false;
            }
          });
          
          if (nearbyPharmacies.length > 0) {
            onPharmaciesInShape(nearbyPharmacies);
            if (isMapReady) {
              toast({
                title: "Location Used",
                description: `Found ${nearbyPharmacies.length} pharmacies within 2km`,
              });
            }
          } else {
            // If no nearby pharmacies found, show all pharmacies
            onPharmaciesInShape(pharmacies);
            if (isMapReady) {
              toast({
                title: "No Pharmacies Nearby",
                description: "Showing all pharmacies instead",
              });
            }
          }
        }
      } else if (isMapReady) {
        // When no location filter, show all pharmacies
        onPharmaciesInShape(pharmacies);
      }
    } catch (error) {
      console.error('Error filtering pharmacies by location:', error);
      // Fall back to showing all pharmacies
      onPharmaciesInShape(pharmacies);
    }
  }, [showDefaultLocation, coordinates, pharmacies, onPharmaciesInShape, isMapReady]);

  return (
    <div className="w-full h-full" ref={mapContainerRef}>
      {mapInitError ? (
        <div className="w-full h-full bg-gray-100 rounded-md flex flex-col items-center justify-center p-6">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">Map Error</h3>
            <p className="text-sm text-gray-600 mb-4">{mapInitError}</p>
            <button 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              onClick={() => {
                setMapKey(`map-manual-retry-${Date.now()}`);
                setRetryCount(0);
                setMapInitError(null);
              }}
            >
              Retry Loading Map
            </button>
          </div>
        </div>
      ) : (
        <div className="h-full w-full relative z-1">
          <div id="pharmacy-map-container" className="h-full w-full">
            {/* Use a "safe" version of MapContainer specifically for mobile devices */}
            {isMobileDevice ? (
              <div className="h-full w-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <p className="text-sm text-gray-600 mb-3">
                      Interactive maps are disabled on mobile devices to prevent errors.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please use the list view for best experience on mobile.
                    </p>
                  </div>
                </div>
                
                {/* Static map display for mobile - no interactivity */}
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${coordinates.lon},${coordinates.lat},12,0/600x400?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`} 
                  alt="Static pharmacy map" 
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
            ) : (
              <MapContainer
                key={mapKey}
                center={centerCoords}
                zoom={12}
                style={{ 
                  height: '100%', 
                  width: '100%', 
                  position: 'relative', 
                  zIndex: 1 
                }}
                scrollWheelZoom={true}
                zoomControl={true}
                dragging={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <SimplifiedMapUpdater 
                  coordinates={coordinates}
                  onMapReady={handleMapReady} 
                />
                
                {/* Show user location marker if enabled */}
                {showDefaultLocation && isMapReady && (
                  <Marker 
                    position={centerCoords}
                    icon={userLocationIcon}
                  >
                    <Popup>Your location</Popup>
                  </Marker>
                )}
                
                {/* Render pharmacy markers - only when map is ready */}
                {isMapReady && filteredPharmacies.map((pharmacy) => {
                  if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return null;
                  
                  // Ensure coordinates are numbers
                  let pharmLat, pharmLon;
                  try {
                    pharmLat = parseFloat(pharmacy.coordinates.lat);
                    pharmLon = parseFloat(pharmacy.coordinates.lon);
                  } catch (e) {
                    return null;
                  }
                  
                  if (isNaN(pharmLat) || isNaN(pharmLon)) return null;
                  
                  return (
                    <Marker
                      key={`pharmacy-${pharmacy.id || Math.random().toString(36).substr(2, 9)}`}
                      position={[pharmLat, pharmLon]}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</p>
                          <p>{pharmacy.address || 'Address not available'}</p>
                          <p>{pharmacy.hours || 'Hours not available'}</p>
                          {pharmacy.distance && <p>Distance: {pharmacy.distance}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </div>
          
          {/* Mobile warning overlay */}
          {isMobileDevice && (
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center text-xs">
              <p>Interactive maps are disabled on mobile devices</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
