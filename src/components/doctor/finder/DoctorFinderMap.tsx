
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import L from 'leaflet';
import type { Doctor } from '@/lib/types/overpass.types';

// Fix Leaflet marker icon issue with a safer approach
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set the default icon
L.Marker.prototype.options.icon = DefaultIcon;

// Custom doctor icon
const doctorIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3022/3022339.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// Custom user location icon
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1673/1673221.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Component to set map reference
function MapRef({ setMapRef }: { setMapRef: (map: L.Map) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      setMapRef(map);
    }
  }, [map, setMapRef]);
  
  return null;
}

interface DoctorFinderMapProps {
  doctors: Doctor[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
  onDoctorSelect: (doctorId: string, source?: string) => void;
}

export const DoctorFinderMap = ({
  doctors,
  userLocation,
  useLocationFilter,
  onDoctorSelect
}: DoctorFinderMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  // Default to Luxembourg coordinates
  const defaultCenter = { lat: 49.8153, lng: 6.1296 };
  
  // Determine center based on available data
  const mapCenter = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lon }
    : defaultCenter;

  const setMap = (map: L.Map) => {
    mapRef.current = map;
    setIsMapReady(true);
    setIsMapLoading(false);
  };

  // Update map view when user toggles location
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    
    if (useLocationFilter && userLocation) {
      try {
        mapRef.current.setView(
          [userLocation.lat, userLocation.lon],
          12
        );
      } catch (error) {
        console.error('Error setting map view:', error);
      }
    }
  }, [useLocationFilter, userLocation, isMapReady]);

  // Fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !doctors?.length) return;
    
    try {
      const bounds = L.latLngBounds([]);
      let hasValidMarkers = false;
      
      // Add doctor markers to bounds
      doctors.forEach(doctor => {
        if (doctor.coordinates?.lat && doctor.coordinates?.lon) {
          const lat = Number(doctor.coordinates.lat);
          const lon = Number(doctor.coordinates.lon);
          
          if (!isNaN(lat) && !isNaN(lon)) {
            bounds.extend([lat, lon]);
            hasValidMarkers = true;
          }
        }
      });
      
      // Add user location to bounds if available
      if (userLocation?.lat && userLocation?.lon) {
        const userLat = Number(userLocation.lat);
        const userLon = Number(userLocation.lon);
        
        if (!isNaN(userLat) && !isNaN(userLon)) {
          bounds.extend([userLat, userLon]);
          hasValidMarkers = true;
        }
      }
      
      // Fit bounds if we have valid markers
      if (hasValidMarkers && mapRef.current) {
        mapRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 14
        });
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [doctors, userLocation, isMapReady]);

  // Map events component
  function MapEvents() {
    useMapEvents({
      load: () => {
        console.log('Map loaded successfully');
        setIsMapLoading(false);
      },
    });
    
    return null;
  }
  
  // Filter out doctors without coordinates and validate them
  const doctorsWithCoordinates = doctors?.filter(
    doctor => {
      if (!doctor.coordinates?.lat || !doctor.coordinates?.lon) return false;
      
      const lat = Number(doctor.coordinates.lat);
      const lon = Number(doctor.coordinates.lon);
      
      return !isNaN(lat) && !isNaN(lon);
    }
  ) || [];

  if (isMapLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {doctors && doctors.length > 0 ? (
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={10}
          style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
        >
          <MapRef setMapRef={setMap} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapEvents />
          
          {/* User location marker */}
          {userLocation && (
            <Marker 
              position={[Number(userLocation.lat), Number(userLocation.lon)]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-semibold">Your Location</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Doctor markers */}
          {doctorsWithCoordinates.map((doctor) => {
            const lat = Number(doctor.coordinates!.lat);
            const lon = Number(doctor.coordinates!.lon);
            
            return (
              <Marker
                key={doctor.id}
                position={[lat, lon]}
                icon={doctorIcon}
              >
                <Popup>
                  <div className="p-1 max-w-xs">
                    <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                    
                    {(doctor.address || doctor.city) && (
                      <p className="text-sm text-gray-600 mt-1">
                        {doctor.address || doctor.city}
                      </p>
                    )}
                    
                    {doctor.distance !== undefined && (
                      <p className="text-sm font-medium mt-1">
                        Distance: {typeof doctor.distance === 'number' ? `${doctor.distance.toFixed(1)} km` : doctor.distance}
                      </p>
                    )}
                    
                    <Button
                      size="sm"
                      className="w-full mt-2 flex items-center justify-center gap-2"
                      onClick={() => onDoctorSelect(doctor.id, doctor.source)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Connect
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500">No doctors found</p>
          </div>
        </div>
      )}
    </div>
  );
};
