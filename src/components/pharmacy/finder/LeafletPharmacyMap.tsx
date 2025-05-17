
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

console.log('LeafletPharmacyMap component loaded');

// Create a red marker for user location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map updater component
const MapUpdater = ({ 
  userLocation, 
  onMapReady 
}: { 
  userLocation: { lat: number; lon: number } | null;
  onMapReady: () => void;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    try {
      console.log('MapUpdater: Map instance available', map);
      // Force resize and redraw
      setTimeout(() => {
        console.log('MapUpdater: Invalidating map size');
        map.invalidateSize(true);
        
        if (userLocation) {
          console.log('MapUpdater: Setting view to user location', userLocation);
          map.setView([userLocation.lat, userLocation.lon], 13);
        } else {
          console.log('MapUpdater: No user location available');
        }
        
        // Notify parent the map is ready
        console.log('MapUpdater: Notifying parent map is ready');
        onMapReady();
      }, 300);
    } catch (err) {
      console.warn('Error updating map view:', err);
    }
  }, [map, userLocation, onMapReady]);
  
  return null;
};

// Safe Draw Control component
const SafeDrawControl = ({ 
  onShapeCreated, 
  pharmacies,
  enabled
}: { 
  onShapeCreated: (pharmaciesInShape: any[]) => void, 
  pharmacies: any[],
  enabled: boolean
}) => {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());
  
  useEffect(() => {
    if (!map || !enabled) {
      console.log('SafeDrawControl: Map not ready or drawing not enabled');
      return;
    }
    
    console.log('SafeDrawControl: Initializing draw controls');
    
    try {
      // Clear existing layers
      drawnItemsRef.current.clearLayers();
      
      // Add the FeatureGroup to the map
      map.addLayer(drawnItemsRef.current);

      // Initialize draw control
      const drawControl = new L.Control.Draw({
        position: 'topright',
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

      console.log('SafeDrawControl: Adding draw control to map');
      // Add control to map
      map.addControl(drawControl);

      // Handle created event
      const handleDrawCreated = (e: any) => {
        try {
          console.log('SafeDrawControl: Shape created', e.layerType);
          const layer = e.layer;
          
          // Clear previous layers
          drawnItemsRef.current.clearLayers();
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
          
          console.log(`SafeDrawControl: Found ${pharmaciesInShape.length} pharmacies in shape`);
          // Notify parent component
          onShapeCreated(pharmaciesInShape);
          
          toast({
            title: "Selection Complete",
            description: `Found ${pharmaciesInShape.length} pharmacies in selected area`,
          });
        } catch (e) {
          console.error('Error processing drawn shape:', e);
        }
      };
      
      console.log('SafeDrawControl: Attaching draw created event');
      map.on(L.Draw.Event.CREATED, handleDrawCreated);

      // Clean up
      return () => {
        try {
          console.log('SafeDrawControl: Cleaning up draw control');
          map.removeControl(drawControl);
          map.off(L.Draw.Event.CREATED, handleDrawCreated);
          map.removeLayer(drawnItemsRef.current);
        } catch (e) {
          console.warn('Error during cleanup:', e);
        }
      };
    } catch (err) {
      console.error('Error setting up draw control:', err);
      return () => {};
    }
  }, [map, pharmacies, onShapeCreated, enabled]);

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
  console.log('LeafletPharmacyMap rendering with:', {
    pharmaciesCount: pharmacies?.length || 0,
    userLocation: userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}` : 'null',
    useLocationFilter
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_ATTEMPTS = 3;
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Default center position (Luxembourg)
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : [49.8153, 6.1296];
  
  console.log('LeafletPharmacyMap using center:', defaultCenter);
  
  // Handle map initialization
  const handleMapReady = useCallback(() => {
    console.log("Leaflet map is ready");
    setIsMapReady(true);
    setIsLoading(false);
    setError(null);
  }, []);
  
  // Handle map initialization errors
  const handleRetry = () => {
    console.log('Retrying map initialization', retryCount + 1);
    setRetryCount(prev => prev < MAX_ATTEMPTS ? prev + 1 : prev);
    setError(null);
    setMapKey(`map-retry-${Date.now()}`);
    setIsLoading(true);
    setIsMapReady(false);
    
    // Force container clear
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
    }
  };

  // Log when the component re-renders
  useEffect(() => {
    console.log('LeafletPharmacyMap mounted/updated with map key:', mapKey);
    return () => console.log('LeafletPharmacyMap unmounted');
  }, [mapKey]);

  // Debug pharmacy data
  useEffect(() => {
    if (pharmacies && pharmacies.length > 0) {
      console.log('Sample pharmacy data for LeafletPharmacyMap:', pharmacies[0]);
    } else {
      console.log('No pharmacy data available for LeafletPharmacyMap');
    }
  }, [pharmacies]);
  
  // Effect to ensure the map container is properly sized
  useEffect(() => {
    if (mapContainerRef.current) {
      // Force explicit height and width
      mapContainerRef.current.style.height = '500px';
      mapContainerRef.current.style.width = '100%';
    }
  }, []);
  
  // If loading, show a skeleton
  if (isLoading && !isMapReady) {
    console.log('LeafletPharmacyMap showing loading state');
    return (
      <div className="w-full h-full min-h-[400px]">
        <Skeleton className="w-full h-full min-h-[400px]" />
      </div>
    );
  }

  // If error occurred, show error message
  if (error) {
    console.log('LeafletPharmacyMap showing error state:', error);
    return (
      <div className="bg-muted p-4 rounded-md text-center h-[400px] flex items-center justify-center flex-col">
        <p className="text-red-500 font-semibold mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Please try again later</p>
        <Button 
          className="mt-4"
          variant="outline"
          onClick={handleRetry}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Loading Map
        </Button>
      </div>
    );
  }

  console.log('LeafletPharmacyMap rendering MapContainer', {
    key: mapKey,
    center: defaultCenter
  });

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[500px] relative border rounded-md overflow-hidden"
      style={{ height: '500px', width: '100%' }} // Force explicit dimensions
    >
      <MapContainer
        key={mapKey}
        center={defaultCenter}
        zoom={13}
        style={{ 
          height: '100%', 
          width: '100%', 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater 
          userLocation={userLocation} 
          onMapReady={handleMapReady}
        />
        
        <SafeDrawControl 
          onShapeCreated={onPharmaciesInShape} 
          pharmacies={pharmacies}
          enabled={isMapReady}
        />
        
        {/* User location marker */}
        {userLocation && isMapReady && (
          <Marker 
            position={[userLocation.lat, userLocation.lon]}
            icon={redIcon}
          >
            <Popup>Your location</Popup>
          </Marker>
        )}
        
        {/* Pharmacy markers */}
        {isMapReady && pharmacies && pharmacies.map((pharmacy, index) => {
          if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) {
            console.log(`Pharmacy ${index} missing coordinates`, pharmacy);
            return null;
          }
          
          return (
            <Marker
              key={pharmacy.id || `pharmacy-${Math.random().toString(36).substr(2, 9)}`}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
            >
              <Popup>
                <div className="text-sm max-w-[250px]">
                  <h3 className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</h3>
                  <p className="text-xs">{pharmacy.address || 'Address not available'}</p>
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
