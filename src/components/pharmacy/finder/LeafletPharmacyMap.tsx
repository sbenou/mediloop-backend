
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red marker for user location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Safe Map Controls component
const SafeDrawControl = ({ onShapeCreated, pharmacies }: { onShapeCreated: (pharmaciesInShape: any[]) => void, pharmacies: any[] }) => {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());
  
  useEffect(() => {
    if (!map) return;
    
    try {
      // Add the FeatureGroup to the map
      map.addLayer(drawnItemsRef.current);

      // Initialize the draw control with safe options
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnItemsRef.current
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

      // Safely add control
      try {
        map.addControl(drawControl);
      } catch (err) {
        console.warn('Error adding draw control:', err);
      }

      // Handle the created event safely
      map.on(L.Draw.Event.CREATED, (e: any) => {
        try {
          const layer = e.layer;
          drawnItemsRef.current.addLayer(layer);
          
          // Filter pharmacies within the shape
          const shape = layer;
          const pharmaciesInShape = pharmacies.filter(pharmacy => {
            if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
            
            const point = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
            
            if (shape instanceof L.Circle) {
              return shape.getLatLng().distanceTo(point) <= shape.getRadius();
            } else if (shape instanceof L.Polygon || shape instanceof L.Rectangle) {
              return shape.getBounds().contains(point);
            }
            
            return false;
          });
          
          // Callback with filtered pharmacies
          onShapeCreated(pharmaciesInShape);
        } catch (e) {
          console.error('Error processing drawn shape:', e);
        }
      });

      // Clean up
      return () => {
        try {
          map.removeControl(drawControl);
          map.removeLayer(drawnItemsRef.current);
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
      };
    } catch (err) {
      console.error('Error setting up draw control:', err);
      return () => {};
    }
  }, [map, pharmacies, onShapeCreated]);

  return null;
};

// Safe map updater component
const SafeMapUpdater = ({ userLocation }: { userLocation: { lat: number; lon: number } | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !userLocation) return;
    
    try {
      // Safely update view
      map.setView([userLocation.lat, userLocation.lon], 13);
    } catch (err) {
      console.warn('Error updating map view:', err);
    }
  }, [map, userLocation]);
  
  return null;
};

interface LeafletPharmacyMapProps {
  pharmacies: any[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
  onPharmaciesInShape: (pharmacies: any[]) => void;
}

const LeafletPharmacyMap: React.FC<LeafletPharmacyMapProps> = ({ 
  pharmacies, 
  userLocation, 
  useLocationFilter,
  onPharmaciesInShape
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [mapInitAttempts, setMapInitAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : [49.8153, 6.1296]; // Luxembourg center
  
  // Add global error handler for Leaflet errors
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      if (e.message && (
        e.message.includes('a is not a function') || 
        e.message.includes('touchleave')
      )) {
        console.warn('Caught Leaflet-related error:', e.message);
        e.preventDefault();
        return true;
      }
      return false;
    };
    
    window.addEventListener('error', handleError, true);
    
    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);
  
  // Safely initialize map with retry mechanism
  const handleMapCreated = (map: L.Map) => {
    try {
      // Disable problematic touch handlers
      if (map) {
        map.options.touchZoom = false;
        map.options.tap = false;
        
        // Apply additional fixes for mobile
        if (typeof window !== 'undefined' && 'ontouchstart' in window) {
          // Manually disable handlers that are causing issues
          const mapProto = (L.Map as any).prototype;
          const originalAddHandler = mapProto.addHandler;
          
          // Replace the addHandler method to skip problematic handlers
          mapProto.addHandler = function(name: string, HandlerClass: any) {
            if (name === 'touchZoom' || name === 'tap') {
              return this;
            }
            return originalAddHandler.call(this, name, HandlerClass);
          };
        }
      }
      
      setIsMapReady(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error during map initialization:", err);
      
      if (mapInitAttempts < MAX_ATTEMPTS) {
        // Try to recover
        setMapKey(`map-retry-${Date.now()}-${mapInitAttempts}`);
        setMapInitAttempts(prev => prev + 1);
      } else {
        setError("Failed to initialize map after multiple attempts");
        setIsLoading(false);
      }
    }
  };
  
  if (isLoading && !isMapReady) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (error) {
    return (
      <div className="bg-muted p-4 rounded-md text-center h-[400px] flex items-center justify-center flex-col">
        <p className="text-red-500 font-semibold mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          onClick={() => {
            setMapInitAttempts(0);
            setError(null);
            setMapKey(`map-fresh-${Date.now()}`);
            setIsLoading(true);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-[400px] border rounded-md overflow-hidden">
      <MapContainer
        key={mapKey}
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenCreated={handleMapCreated}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SafeMapUpdater userLocation={userLocation} />
        <SafeDrawControl onShapeCreated={onPharmaciesInShape} pharmacies={pharmacies} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lon]}
            icon={redIcon}
          >
            <Popup>Your location</Popup>
          </Marker>
        )}
        
        {/* Pharmacy markers */}
        {isMapReady && pharmacies.map((pharmacy) => {
          if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return null;
          
          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
            >
              <Popup>
                <div className="text-sm max-w-[250px]">
                  <h3 className="font-semibold">{pharmacy.name}</h3>
                  <p className="text-xs">{pharmacy.address}</p>
                  {pharmacy.hours && <p className="text-xs">Hours: {pharmacy.hours}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LeafletPharmacyMap;
