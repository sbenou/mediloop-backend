
import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from "@/components/ui/use-toast";
import { Map } from 'lucide-react';
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
const isMobileDevice = typeof window !== 'undefined' && 
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Mobile-friendly static map component that doesn't use Leaflet
const MobileStaticMap: React.FC<PharmacyMapProps> = ({ 
  coordinates, 
  filteredPharmacies,
  showDefaultLocation 
}) => {
  console.log('Rendering MobileStaticMap with', filteredPharmacies.length, 'pharmacies');
  
  const mapUrl = useMemo(() => {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${coordinates.lon},${coordinates.lat},12,0/600x400?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`;
  }, [coordinates]);
  
  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center p-6 bg-white/80 rounded-lg max-w-xs">
          <Map className="h-10 w-10 text-primary/60 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">
            Interactive maps are disabled on mobile devices to prevent errors.
          </p>
          <p className="text-xs text-muted-foreground">
            {filteredPharmacies.length} pharmacies found 
            {showDefaultLocation ? ' near your location' : ''}
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
        <p>Interactive maps are disabled on mobile devices</p>
      </div>
    </div>
  );
};

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
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  // Default center position for Luxembourg
  const defaultCenter: [number, number] = [49.8153, 6.1296];
  
  // Ensure coordinates are valid numbers
  const centerCoords = useMemo<[number, number]>(() => {
    if (coordinates && 
        typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) &&
        typeof coordinates.lon === 'number' && !isNaN(coordinates.lon)) {
      console.log('Using provided coordinates:', coordinates);
      return [coordinates.lat, coordinates.lon];
    }
    console.log('Using default coordinates');
    return defaultCenter;
  }, [coordinates]);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapKey] = useState(`map-${Date.now()}`);
  
  useEffect(() => {
    // When pharmacies change, pass them to the parent
    if (filteredPharmacies.length > 0) {
      console.log('Passing filtered pharmacies to parent:', filteredPharmacies.length);
      onPharmaciesInShape(filteredPharmacies);
    }
  }, [filteredPharmacies, onPharmaciesInShape]);

  // Force setting map ready after a delay
  useEffect(() => {
    if (!isMapReady) {
      const timer = setTimeout(() => {
        console.log('Force setting map ready state');
        setIsMapReady(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMapReady]);
  
  // For mobile devices, return the static map component
  if (isMobileDevice) {
    console.log('Using static map for mobile device');
    return (
      <MobileStaticMap
        coordinates={coordinates}
        pharmacies={pharmacies}
        filteredPharmacies={filteredPharmacies}
        onPharmaciesInShape={onPharmaciesInShape}
        showDefaultLocation={showDefaultLocation}
      />
    );
  }

  console.log('Rendering desktop map with centerCoords:', centerCoords);
  return (
    <div className="w-full h-full relative z-10">
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          key={mapKey}
          center={centerCoords}
          zoom={12}
          style={{ 
            height: '100%', 
            width: '100%' 
          }}
          scrollWheelZoom={false}
          zoomControl={true}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <SimplifiedMapUpdater 
            coordinates={coordinates}
            onMapReady={() => {
              console.log('Map is ready callback');
              setIsMapReady(true);
            }}
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
          
          {/* Render pharmacy markers - limit to 50 for performance */}
          {isMapReady && filteredPharmacies.slice(0, 50).map((pharmacy, index) => {
            if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) {
              console.log('Pharmacy missing coordinates:', pharmacy.id);
              return null;
            }
            
            // Ensure coordinates are numbers
            let pharmLat, pharmLon;
            try {
              pharmLat = parseFloat(pharmacy.coordinates.lat);
              pharmLon = parseFloat(pharmacy.coordinates.lon);
              
              if (isNaN(pharmLat) || isNaN(pharmLon)) {
                console.log('Invalid pharmacy coordinates (NaN):', pharmacy.id);
                return null;
              }
              
              return (
                <Marker
                  key={`pharmacy-${pharmacy.id || index}`}
                  position={[pharmLat, pharmLon]}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</p>
                      <p>{pharmacy.address || 'Address not available'}</p>
                      <p>{pharmacy.hours || 'Hours not available'}</p>
                      {pharmacy.distance && <p>Distance: {pharmacy.distance} km</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            } catch (err) {
              console.error('Error adding pharmacy marker:', err);
              return null;
            }
          })}
        </MapContainer>
      </div>
    </div>
  );
}
