
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw, Map } from 'lucide-react';

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

// Detect if the current device is a mobile device
const isMobile = typeof window !== 'undefined' ? 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 
  false;

// Static version that doesn't use Leaflet at all for mobile devices
const MobileMapFallback: React.FC<{
  userLocation: { lat: number; lon: number } | null;
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
}> = ({ userLocation, pharmacies, onPharmaciesInShape }) => {
  
  useEffect(() => {
    // Just show all pharmacies without any filtering
    onPharmaciesInShape(pharmacies);
    
    toast({
      title: "Mobile Experience",
      description: "Interactive maps are disabled on mobile for better compatibility.",
      duration: 5000
    });
  }, [pharmacies, onPharmaciesInShape]);
  
  // Generate static map URL using Mapbox
  const mapUrl = userLocation 
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${userLocation.lon},${userLocation.lat},11,0/600x400?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`
    : `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/6.1296,49.8153,11,0/600x400?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`;
  
  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center p-6 bg-white/80 rounded-lg shadow-sm max-w-xs">
          <Map className="h-10 w-10 text-primary/60 mx-auto mb-2" />
          <h3 className="text-base font-medium mb-2">Static Map View</h3>
          <p className="text-sm text-gray-600 mb-3">
            Interactive maps are disabled on mobile devices for better compatibility.
          </p>
          <p className="text-xs text-muted-foreground">
            {pharmacies.length} pharmacies available in this area
          </p>
        </div>
      </div>
      
      <img 
        src={mapUrl}
        alt="Static pharmacy map" 
        className="w-full h-full object-cover"
        loading="eager"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
        }}
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center text-xs">
        <p>Interactive maps are not available on mobile devices</p>
      </div>
    </div>
  );
};

// Custom map updater component without any event bindings
const SimpleMapUpdater: React.FC<{
  coordinates: { lat: number; lon: number } | null;
  onMapReady?: () => void;
}> = ({ coordinates, onMapReady }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    // Just signal that the map is ready
    if (onMapReady) onMapReady();
  }, [onMapReady]);

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Quick fallback for map ready state
  useEffect(() => {
    if (isMapReady) return;
    
    const quickFallback = setTimeout(() => {
      if (!isMapReady) {
        console.log('Quick fallback activating map ready state');
        setIsMapReady(true);
        setIsLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(quickFallback);
  }, [isMapReady]);
  
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

  // For mobile devices, don't even try to use Leaflet
  if (isMobile) {
    return (
      <MobileMapFallback 
        userLocation={userLocation}
        pharmacies={pharmacies}
        onPharmaciesInShape={onPharmaciesInShape}
      />
    );
  }

  // Desktop version uses Leaflet with simplified functionality
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
        scrollWheelZoom={false} // Disable scroll wheel zoom to prevent issues
        zoomControl={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SimpleMapUpdater 
          coordinates={userLocation} 
          onMapReady={handleMapReady}
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
    </div>
  );
};

export default LeafletPharmacyMap;
