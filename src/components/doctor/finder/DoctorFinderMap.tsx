
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

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
    setMapRef(map);
  }, [map, setMapRef]);
  
  return null;
}

interface Doctor {
  id: string;
  full_name: string;
  city?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
  distance?: number;
  phone?: string;
  email?: string;
  hours?: string;
  source?: 'database' | 'overpass';
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
  const recoilUserLocation = useRecoilValue(userLocationState);
  
  // Default to Luxembourg coordinates
  const defaultCenter = { lat: 49.8153, lng: 6.1296 };
  
  // Determine center based on available data
  const mapCenter = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lon }
    : recoilUserLocation
    ? { lat: recoilUserLocation.lat, lng: recoilUserLocation.lon }
    : defaultCenter;

  const setMap = (map: L.Map) => {
    mapRef.current = map;
  };

  // Log map initialization
  useEffect(() => {
    console.log('Doctor Map initializing with center:', mapCenter);
    console.log('Doctor count:', doctors?.length || 0);
  }, []);

  // Update map view when user toggles location
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (useLocationFilter && userLocation) {
      mapRef.current.setView(
        [userLocation.lat, userLocation.lon],
        12
      );
    }
  }, [useLocationFilter, userLocation]);

  // Fit map to show all markers
  useEffect(() => {
    if (!mapRef.current || !doctors?.length) return;
    
    try {
      const bounds = L.latLngBounds([]);
      let hasValidMarkers = false;
      
      // Add doctor markers to bounds
      doctors.forEach(doctor => {
        if (doctor.coordinates?.lat && doctor.coordinates?.lon) {
          bounds.extend([doctor.coordinates.lat, doctor.coordinates.lon]);
          hasValidMarkers = true;
        }
      });
      
      // Add user location to bounds if available
      if (userLocation?.lat && userLocation?.lon) {
        bounds.extend([userLocation.lat, userLocation.lon]);
        hasValidMarkers = true;
      }
      
      // Fit bounds if we have valid markers
      if (hasValidMarkers) {
        mapRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          maxZoom: 14
        });
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [doctors, userLocation]);

  // Map events component
  function MapEvents() {
    useMapEvents({
      load: (e) => {
        console.log('Map loaded');
      },
    });
    
    return null;
  }
  
  // Filter out doctors without coordinates
  const doctorsWithCoordinates = doctors?.filter(
    doctor => doctor.coordinates?.lat && doctor.coordinates?.lon
  ) || [];
  
  console.log('Doctors with coordinates:', doctorsWithCoordinates.length);

  return (
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
          position={[userLocation.lat, userLocation.lon]}
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
      {doctorsWithCoordinates.map((doctor) => (
        doctor.coordinates && (
          <Marker
            key={doctor.id}
            position={[doctor.coordinates.lat, doctor.coordinates.lon]}
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
        )
      ))}
      
      {doctorsWithCoordinates.length === 0 && !userLocation && (
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control leaflet-bar bg-background p-3 m-2 rounded-md shadow">
            <p className="text-sm font-medium">No doctors found with location data</p>
          </div>
        </div>
      )}
    </MapContainer>
  );
};
