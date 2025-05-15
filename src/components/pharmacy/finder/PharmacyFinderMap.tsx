
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw } from 'lucide-react';

// Fix Leaflet default icon issue with Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom red icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Map updater component to handle map view updates
const MapViewHandler = ({ 
  map, 
  pharmacies, 
  userLocation, 
  useLocationFilter 
}: { 
  map: L.Map; 
  pharmacies: Pharmacy[]; 
  userLocation: { lat: number; lon: number } | null; 
  useLocationFilter: boolean;
}) => {
  useEffect(() => {
    if (!map || !userLocation) return;
    
    try {
      // Set view to user location
      map.setView([userLocation.lat, userLocation.lon], 14);
      
      // If using location filter, fit bounds to include user and nearby pharmacies
      if (useLocationFilter && pharmacies.length > 0) {
        const bounds = L.latLngBounds([L.latLng(userLocation.lat, userLocation.lon)]);
        
        pharmacies.forEach(pharmacy => {
          if (pharmacy.coordinates?.lat && pharmacy.coordinates?.lon) {
            bounds.extend(L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon));
          }
        });
        
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    } catch (error) {
      console.error("Error updating map view:", error);
    }
  }, [map, userLocation, pharmacies, useLocationFilter]);

  return null;
};

// Main map component
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
  const [map, setMap] = useState<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`); 
  const [mapInitAttempts, setMapInitAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  // Default center (Luxembourg)
  const defaultCenter: [number, number] = [49.8153, 6.1296];
  
  // Center coordinates based on user location or default
  const centerCoordinates: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : defaultCenter;

  // Handle map initialization with error handling
  const handleMapInit = (mapInstance: L.Map) => {
    try {
      // Apply fixes for touch events
      if (L.Browser.touch) {
        // Disable the problematic handlers
        mapInstance.options.touchZoom = false;
        mapInstance.options.tap = false;
        
        // Override problematic methods
        if (typeof window !== 'undefined' && 'ontouchstart' in window) {
          // Safe patching for touch handlers
          const mapProto = (L.Map as any).prototype;
          const originalAddHandler = mapProto.addHandler;
          
          // Replace addHandler to skip problematic handlers
          mapProto.addHandler = function(name: string, HandlerClass: any) {
            if (name === 'touchZoom' || name === 'tap') {
              return this;
            }
            return originalAddHandler.call(this, name, HandlerClass);
          };
          
          // Additional safety for event handling
          const originalOn = mapInstance.on;
          mapInstance.on = function(type: string, fn: Function, context?: any) {
            if (type.includes('touch')) {
              try {
                return originalOn.call(this, type, function(e: any) {
                  try {
                    return fn.call(context || this, e);
                  } catch (error) {
                    console.warn(`Caught error in ${type} handler:`, error);
                    return undefined;
                  }
                }, context);
              } catch (error) {
                console.warn(`Error attaching ${type} handler:`, error);
                return this;
              }
            }
            return originalOn.call(this, type, fn, context);
          };
        }
      }
      
      setMap(mapInstance);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      console.error("Error initializing map:", err);
      setError(err instanceof Error ? err : new Error("Failed to initialize map"));
      setIsLoading(false);
      
      // Attempt recovery if under max attempts
      if (mapInitAttempts < MAX_ATTEMPTS) {
        setTimeout(() => {
          setMapKey(`map-retry-${Date.now()}-${mapInitAttempts}`);
          setMapInitAttempts(prev => prev + 1);
          setError(null);
          setIsLoading(true);
        }, 1000);
      } else {
        toast({
          title: "Map Error",
          description: "Failed to initialize map after multiple attempts. Please refresh the page.",
          variant: "destructive"
        });
      }
    }
  };

  // Global error handler for Leaflet
  useEffect(() => {
    // Setup a global error handler to catch touch-related errors
    const handleError = (e: ErrorEvent) => {
      if (e.message && (
        e.message.includes('a is not a function') || 
        e.message.includes('touchleave')
      )) {
        console.warn('Caught global Leaflet error:', e.message);
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

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">Failed to load map</p>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button 
            onClick={() => {
              setMapKey(`map-retry-${Date.now()}`);
              setMapInitAttempts(0);
              setError(null);
              setIsLoading(true);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        key={mapKey}
        center={centerCoordinates}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        whenCreated={handleMapInit}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {map && (
          <MapViewHandler 
            map={map}
            pharmacies={pharmacies}
            userLocation={userLocation}
            useLocationFilter={useLocationFilter}
          />
        )}
        
        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lon]}
            icon={userIcon}
          >
            <Popup>Your location</Popup>
          </Marker>
        )}
        
        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy) => {
          if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return null;
          
          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
            >
              <Popup>
                <div className="text-sm max-w-[250px]">
                  <h3 className="font-semibold">{pharmacy.name}</h3>
                  <p className="text-xs mt-1">{pharmacy.address}</p>
                  {pharmacy.hours && <p className="text-xs mt-1">Hours: {pharmacy.hours}</p>}
                  {pharmacy.phone && <p className="text-xs mt-1">Phone: {pharmacy.phone}</p>}
                  {pharmacy.distance && <p className="text-xs mt-1">Distance: {pharmacy.distance}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
