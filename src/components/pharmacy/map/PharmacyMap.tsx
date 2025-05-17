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

// Add global error catching for Leaflet specifically
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && (
      e.message.includes('a is not a function') || 
      e.message.includes('touchleave')
    )) {
      console.warn('Caught Leaflet-related error:', e.message);
      e.preventDefault();
      return true;
    }
    return false;
  }, true);
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
  
  // Handle map creation errors with auto-retry
  const handleMapError = useCallback(() => {
    console.log("Map initialization error detected");
    setMapInitError("Map initialization error. Retrying...");
    
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setMapKey(`map-retry-${Date.now()}`);
        setRetryCount(prev => prev + 1);
      }, 500);
    } else {
      setMapInitError("Could not initialize map. Please try again later.");
    }
  }, [retryCount]);
  
  // Handle map ready state
  const handleMapReady = useCallback(() => {
    console.log("PharmacyMap: Map is ready");
    setIsMapReady(true);
    setMapInitError(null);
    
    // Clear any pending timeouts
    if (mapReadyTimeoutRef.current) {
      clearTimeout(mapReadyTimeoutRef.current);
      mapReadyTimeoutRef.current = null;
    }
  }, []);
  
  // Add fallback timeout to set map as ready even if events fail
  useEffect(() => {
    if (isMapReady) return;
    
    mapReadyTimeoutRef.current = setTimeout(() => {
      console.log('PharmacyMap: Fallback timeout reached, forcing ready state');
      setIsMapReady(true);
    }, 5000); // 5 second fallback
    
    return () => {
      if (mapReadyTimeoutRef.current) {
        clearTimeout(mapReadyTimeoutRef.current);
      }
    };
  }, [isMapReady]);
  
  // Filter pharmacies when user location changes
  useEffect(() => {
    if (!pharmacies || !Array.isArray(pharmacies) || !isMapReady) return;
    
    try {
      if (showDefaultLocation && coordinates) {
        // When location is enabled, show pharmacies nearby
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
              return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
            } catch (error) {
              console.error('Error calculating distance for pharmacy:', error);
              return false;
            }
          });
          
          if (nearbyPharmacies.length > 0) {
            onPharmaciesInShape(nearbyPharmacies);
            toast({
              title: "Location Used",
              description: `Found ${nearbyPharmacies.length} pharmacies within 2km`,
            });
          } else {
            // If no nearby pharmacies found, show all pharmacies
            onPharmaciesInShape(pharmacies);
            toast({
              title: "No Pharmacies Nearby",
              description: "Showing all pharmacies instead",
            });
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
    <div className="w-full h-full">
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
              whenCreated={(map) => {
                // Additional safety for map initialization
                try {
                  console.log('PharmacyMap: Map instance created');
                  
                  // Disable problematic handlers
                  map.options.touchZoom = false;
                  map.options.tap = false;
                  
                  // Force resize right away
                  map.invalidateSize(true);
                  
                  // Fire ready event after a short delay to ensure map is fully loaded
                  setTimeout(() => {
                    try {
                      map.invalidateSize(true);
                      console.log('PharmacyMap: Forced map invalidation after delay');
                    } catch (e) {
                      console.warn('Error in delayed map resize:', e);
                    }
                  }, 500);
                } catch (e) {
                  console.warn('Error in map creation:', e);
                  handleMapError();
                }
              }}
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
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
