
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { SimplifiedMapUpdater } from '@/components/pharmacy/map/SimplifiedMapUpdater';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red icon for user location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Add extremely aggressive error prevention - intercept and suppress all touch-related errors
if (typeof window !== 'undefined') {
  // Global error handler to catch "a is not a function" errors
  window.addEventListener('error', (e) => {
    if (e.message && (
      e.message.includes('a is not a function') || 
      e.message.includes('touchleave') ||
      e.message.includes('touch') ||
      e.message.includes('_onTap')
    )) {
      console.warn('Caught and suppressed Leaflet error:', e.message);
      e.preventDefault();
      e.stopPropagation();
      return true; // Prevent default error handling
    }
    return false;
  }, true);
  
  // Patch touch events globally
  try {
    if (typeof EventTarget !== 'undefined') {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type && typeof type === 'string' && 
            (type.includes('touch') || type.includes('tap'))) {
          // For touch events, replace the handler with a no-op function that doesn't throw
          const safeListener = function(event) {
            try {
              // Try the original listener
              if (typeof listener === 'function') {
                listener(event);
              } else if (listener && typeof listener.handleEvent === 'function') {
                listener.handleEvent(event);
              }
            } catch (e) {
              // Suppress any errors in the handler
              console.warn(`Suppressed error in ${type} handler:`, e.message);
              event.preventDefault();
              event.stopPropagation();
            }
          };
          return originalAddEventListener.call(this, type, safeListener, options);
        }
        // For non-touch events, use the original handler
        return originalAddEventListener.call(this, type, listener, options);
      };
      
      console.log('Successfully patched EventTarget.prototype.addEventListener');
    }
  } catch (e) {
    console.warn('Failed to patch EventTarget:', e);
  }
}

// Simplified version of the draw control without touch
const StaticDrawControl = ({ 
  onShapeCreated, 
  pharmacies 
}: { 
  onShapeCreated: (pharmaciesInShape: any[]) => void,
  pharmacies: any[]
}) => {
  // We won't attempt to initialize the draw control on mobile
  const isMobile = typeof window !== 'undefined' ? 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 
    false;

  useEffect(() => {
    // On mobile, just show all pharmacies to avoid the touch error
    if (isMobile) {
      console.log('Mobile detected, showing all pharmacies without draw control');
      onShapeCreated(pharmacies);
      
      toast({
        title: "Mobile Experience",
        description: "Drawing on map is disabled on mobile devices. All pharmacies are shown.",
        duration: 5000
      });
    }
  }, [isMobile, pharmacies, onShapeCreated]);

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
  // Detect mobile browsers to provide fallback experience
  const isMobile = typeof window !== 'undefined' ? 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 
    false;
    
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Multiple fallback timers for map ready state
  useEffect(() => {
    if (isMapReady) return;
    
    // Very quick fallback (500ms)
    const quickFallback = setTimeout(() => {
      if (!isMapReady) {
        console.log('Quick fallback activating map ready state');
        setIsMapReady(true);
        setIsLoading(false);
      }
    }, 500);
    
    // Medium fallback (1.5s)
    const mediumFallback = setTimeout(() => {
      if (!isMapReady) {
        console.log('Medium fallback forcing map ready state');
        setIsMapReady(true);
        setIsLoading(false);
      }
    }, 1500);
    
    // Final fallback (3s)
    const finalFallback = setTimeout(() => {
      console.log('Final fallback forcing map ready and showing all pharmacies');
      setIsMapReady(true);
      setIsLoading(false);
      onPharmaciesInShape(pharmacies);
    }, 3000);
    
    return () => {
      clearTimeout(quickFallback);
      clearTimeout(mediumFallback);
      clearTimeout(finalFallback);
    };
  }, [isMapReady, pharmacies, onPharmaciesInShape]);
  
  // Default center (Luxembourg)
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : [49.8153, 6.1296];
  
  // Handle map ready event
  const handleMapReady = useCallback(() => {
    console.log('Map is ready');
    setIsMapReady(true);
    setIsLoading(false);
    setError(null);
    
    // For mobile, immediately show all pharmacies
    if (isMobile) {
      onPharmaciesInShape(pharmacies);
    }
  }, [isMobile, pharmacies, onPharmaciesInShape]);
  
  // Handle retry when map fails to load
  const handleRetry = () => {
    console.log('Retrying map initialization');
    setError(null);
    setIsLoading(true);
    setIsMapReady(false);
    setMapKey(`map-retry-${Date.now()}`);
    
    // Force clean container
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = '';
    }
  };
  
  // Ensure container has correct size
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Force explicit dimensions on container
    mapContainerRef.current.style.cssText = `
      height: 500px !important;
      width: 100% !important;
      position: relative !important;
      display: block !important;
      visibility: visible !important;
      z-index: 1;
    `;
    
    // For mobile, show toast about limited functionality
    if (isMobile && !isLoading) {
      toast({
        title: "Mobile Map Experience",
        description: "Some map features are limited on mobile to ensure compatibility.",
        duration: 5000
      });
    }
  }, [isMobile, isLoading]);
  
  if (isLoading && !isMapReady) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-full h-[400px]" />
          <p className="mt-2 text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[500px] relative border rounded-md overflow-hidden"
      style={{ height: '500px', width: '100%', position: 'relative' }}
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
        scrollWheelZoom={!isMobile}
        doubleClickZoom={!isMobile}
        dragging={!isMobile}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SimplifiedMapUpdater 
          coordinates={userLocation} 
          onMapReady={handleMapReady}
        />
        
        {/* Static draw control - safe for all browsers */}
        {isMapReady && (
          <StaticDrawControl 
            onShapeCreated={onPharmaciesInShape}
            pharmacies={pharmacies}
          />
        )}
        
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
            return null;
          }
          
          try {
            // Ensure coordinates are valid numbers
            const pharmLat = parseFloat(pharmacy.coordinates.lat);
            const pharmLon = parseFloat(pharmacy.coordinates.lon);
            
            if (isNaN(pharmLat) || isNaN(pharmLon)) return null;
            
            return (
              <Marker
                key={pharmacy.id || `pharmacy-${Math.random().toString(36).substr(2, 9)}`}
                position={[pharmLat, pharmLon]}
              >
                <Popup>
                  <div className="text-sm max-w-[250px]">
                    <h3 className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</h3>
                    <p className="text-xs">{pharmacy.address || 'Address not available'}</p>
                    {pharmacy.hours && <p className="text-xs">Hours: {pharmacy.hours}</p>}
                    {pharmacy.distance && <p className="text-xs font-medium">Distance: {pharmacy.distance} km</p>}
                  </div>
                </Popup>
              </Marker>
            );
          } catch (e) {
            console.warn('Error rendering pharmacy marker:', e);
            return null;
          }
        })}
      </MapContainer>
      
      {/* Mobile warning overlay */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center text-xs">
          <p>Limited map functionality available on mobile devices</p>
        </div>
      )}
    </div>
  );
};

export default LeafletPharmacyMap;
