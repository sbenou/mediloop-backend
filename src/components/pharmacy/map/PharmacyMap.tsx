
import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Component to initialize the draw control
function DrawControl() {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    if (!map) return;

    try {
      // Add the FeatureGroup to the map
      map.addLayer(drawnItemsRef.current);

      // Check if Leaflet.Draw is properly loaded
      if (!L.Draw) {
        console.error("L.Draw is not available");
        return;
      }

      // Initialize the draw control and pass it the FeatureGroup of editable layers
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.current,
          poly: {
            allowIntersection: false
          }
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true
          },
          polyline: false,
          rectangle: true,
          circle: true,
          marker: false,
          circlemarker: false
        }
      });

      // Add the draw control to the map
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Set up event handlers safely
      const handleDrawCreated = (e: any) => {
        try {
          const layer = e.layer;
          drawnItemsRef.current.addLayer(layer);
          console.log('Shape created', layer);
        } catch (error) {
          console.error('Error handling draw created event:', error);
        }
      };

      map.on(L.Draw.Event.CREATED, handleDrawCreated);

      // Clean up on component unmount
      return () => {
        try {
          if (drawControlRef.current) {
            map.removeControl(drawControlRef.current);
          }
          map.removeLayer(drawnItemsRef.current);
          map.off(L.Draw.Event.CREATED, handleDrawCreated);
        } catch (error) {
          console.error('Error cleaning up draw control:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up draw control:', error);
    }
  }, [map]);

  return null;
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
    if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number' && 
        !isNaN(coordinates.lat) && !isNaN(coordinates.lon)) {
      return [coordinates.lat, coordinates.lon];
    }
    return defaultCenter;
  }, [coordinates]);
  
  // Debug information
  console.log("PharmacyMap: rendering", {
    hasCoordinates: !!coordinates,
    pharmCount: pharmacies?.length,
    filteredCount: filteredPharmacies?.length,
    leafletLoaded: !!L,
    reactLeafletLoaded: !!MapContainer
  });
  
  console.log("PharmacyMap: center coordinates", centerCoords);

  // Add key state to force re-render when needed
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const mapInitialized = useRef(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  
  // Force re-render of the map when coordinates change
  useEffect(() => {
    // Only update the key if the coordinates have actually changed
    if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
      if (!mapInitialized.current) {
        mapInitialized.current = true;
      } else {
        setMapKey(`map-${Date.now()}-${coordinates.lat.toFixed(4)}-${coordinates.lon.toFixed(4)}`);
      }
    }
  }, [coordinates?.lat, coordinates?.lon]);
  
  // Filter pharmacies for the manual drawing functionality
  useEffect(() => {
    if (!pharmacies || !Array.isArray(pharmacies)) return;
    
    try {
      if (showDefaultLocation && coordinates) {
        // When location is enabled, show pharmacies nearby
        const userLocation = coordinates ? L.latLng(coordinates.lat, coordinates.lon) : null;
        
        if (userLocation) {
          const nearbyPharmacies = pharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            try {
              const pharmLat = parseFloat(pharmacy.coordinates.lat);
              const pharmLon = parseFloat(pharmacy.coordinates.lon);
              
              if (isNaN(pharmLat) || isNaN(pharmLon)) return false;
              
              const pharmacyLocation = L.latLng(pharmLat, pharmLon);
              return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
            } catch (error) {
              console.error('Error calculating distance for pharmacy:', pharmacy, error);
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
      } else {
        // When no location filter, show all pharmacies
        onPharmaciesInShape(pharmacies);
      }
    } catch (error) {
      console.error('Error filtering pharmacies by location:', error);
      // Fall back to showing all pharmacies
      onPharmaciesInShape(pharmacies);
    }
  }, [showDefaultLocation, coordinates, pharmacies, onPharmaciesInShape]);
  
  // Prevent error when no valid pharmacies
  const validPharmacies = useMemo(() => {
    if (!Array.isArray(filteredPharmacies)) return [];
    return filteredPharmacies.filter(pharmacy => 
      pharmacy && 
      pharmacy.coordinates && 
      typeof pharmacy.coordinates.lat !== 'undefined' && 
      typeof pharmacy.coordinates.lon !== 'undefined'
    );
  }, [filteredPharmacies]);
  
  // Handle map initialization errors
  useEffect(() => {
    const handleMapError = (event: ErrorEvent) => {
      if (event.message.includes('a is not a function')) {
        console.error('Caught map initialization error:', event);
        setMapInitError('Map initialization error. Please try refreshing the page.');
      }
    };
    
    window.addEventListener('error', handleMapError);
    
    return () => {
      window.removeEventListener('error', handleMapError);
    };
  }, []);

  return (
    <div className="w-full h-full">
      {mapInitError ? (
        <div className="w-full h-full bg-gray-100 rounded-md flex flex-col items-center justify-center p-6">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
            <h3 className="text-lg font-medium text-red-600 mb-2">Map Error</h3>
            <p className="text-gray-600 mb-4">{mapInitError}</p>
            <button 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      ) : (
        <MapContainer
          key={mapKey}
          center={centerCoords}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(map) => {
            // Prevent the "touchleave" error by patching the event handler
            try {
              if (map && map.getContainer()) {
                const container = map.getContainer();
                const originalAddEventListener = container.addEventListener;
                
                // Override addEventListener to catch problematic events
                container.addEventListener = function (type, fn, ...rest) {
                  if (type === 'touchleave') {
                    console.warn('Prevented problematic touchleave event');
                    return undefined;
                  }
                  return originalAddEventListener.call(this, type, fn, ...rest) as any;
                };
              }
            } catch (e) {
              console.error("Error patching map event handlers:", e);
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <SimplifiedMapUpdater coordinates={coordinates} />
          
          {/* Conditionally include DrawControl to prevent errors */}
          {L.Draw && <DrawControl />}
          
          {/* Render user location marker if using location */}
          {showDefaultLocation && coordinates && (
            <Marker 
              position={centerCoords}
              icon={userLocationIcon}
            >
              <Popup>Your location</Popup>
            </Marker>
          )}
          
          {/* Render pharmacy markers */}
          {validPharmacies.map((pharmacy) => {
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
      )}
    </div>
  );
}
