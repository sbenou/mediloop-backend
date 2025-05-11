
import { Card } from "@/components/ui/card";
import DoctorCard from "@/components/doctor/DoctorCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom red icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create larger icon for selected marker
const selectedIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [31, 51],
  iconAnchor: [15, 51],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default icon for non-selected markers
const defaultIcon = new L.Icon.Default();

// Helper component to update map view when coordinates change
// This replaces the old whenCreated prop which is not available in React Leaflet v5
const MapUpdater = ({ center }: { center: LatLngExpression }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  
  return null;
};

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  email?: string;
  hours?: string;
  source?: 'database' | 'overpass';
  coordinates?: {
    lat: number;
    lon: number;
  };
}

interface DoctorListSectionProps {
  doctors: Doctor[] | undefined;
  isLoading: boolean;
  coordinates: { lat: number; lon: number };
  onConnect: (doctorId: string, source: 'database' | 'overpass') => void;
  showUserLocation?: boolean;
}

const DoctorListSection = ({
  doctors,
  isLoading,
  coordinates,
  onConnect,
  showUserLocation = false
}: DoctorListSectionProps) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [mapKey, setMapKey] = useState(`doctormap-${Date.now()}`);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Refresh the map when coordinates change
  useEffect(() => {
    try {
      setMapKey(`doctormap-${Date.now()}`);
      setIsMapInitialized(false);
      
      // Small delay to ensure map properly reinitializes
      const timer = setTimeout(() => {
        setIsMapInitialized(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } catch (err) {
      console.error("Error refreshing map:", err);
      setMapError("Error loading map");
    }
  }, [coordinates?.lat, coordinates?.lon]);

  if (!coordinates) {
    return <div>Loading location...</div>;
  }

  // Defensive check to ensure coordinates are valid numbers
  const validLat = typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) 
    ? coordinates.lat : 49.8153;
  const validLon = typeof coordinates.lon === 'number' && !isNaN(coordinates.lon)
    ? coordinates.lon : 6.1296;
    
  const centerPosition: LatLngExpression = [validLat, validLon];

  // Ensure doctors is an array 
  const validDoctors = Array.isArray(doctors) ? doctors : [];

  const handleDoctorSelect = (doctorId: string) => {
    try {
      setSelectedDoctorId(doctorId);
      if (listItemRefs.current[doctorId]) {
        listItemRefs.current[doctorId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.error("Error selecting doctor:", err);
    }
  };

  // Filter out doctors with invalid coordinates
  const doctorsWithValidCoordinates = validDoctors.filter(doctor => 
    doctor.coordinates && 
    typeof doctor.coordinates.lat === 'number' && !isNaN(doctor.coordinates.lat) &&
    typeof doctor.coordinates.lon === 'number' && !isNaN(doctor.coordinates.lon)
  );

  return (
    <div className="mt-24 grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
      <div className="overflow-y-auto space-y-4 pr-4 relative z-50">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </>
        )}

        {validDoctors.length > 0 && validDoctors.map((doctor) => (
          <div
            key={doctor.id}
            ref={(el) => listItemRefs.current[doctor.id] = el}
            onClick={() => handleDoctorSelect(doctor.id)}
            className={cn(
              "transition-all duration-200",
              selectedDoctorId === doctor.id && "scale-[1.02]"
            )}
          >
            <DoctorCard
              {...doctor}
              city={doctor.city || 'Unknown location'}
              onConnect={() => onConnect(doctor.id, doctor.source || 'database')}
              isSelected={selectedDoctorId === doctor.id}
            />
          </div>
        ))}

        {validDoctors.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">No doctors found in this area</p>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
        {/* Add fallback div for when map is loading */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
          <p className="text-gray-500">Loading map...</p>
        </div>
        
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
            <div className="text-center p-4">
              <p className="text-red-500 mb-2">{mapError}</p>
              <button 
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                onClick={() => {
                  setMapError(null);
                  setMapKey(`doctormap-${Date.now()}`);
                  setTimeout(() => setIsMapInitialized(true), 100);
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {isMapInitialized && !mapError && (
          <MapContainer
            key={mapKey}
            center={centerPosition}
            zoom={10}
            style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Update map center when coordinates change */}
            <MapUpdater center={centerPosition} />
            
            {showUserLocation && (
              <Marker 
                position={centerPosition} 
                icon={userLocationIcon}
              >
                <Popup>Your location</Popup>
              </Marker>
            )}

            {doctorsWithValidCoordinates.map((doctor) => {
              const docLat = doctor.coordinates?.lat || validLat;
              const docLon = doctor.coordinates?.lon || validLon;
              
              // Ensure coordinates are valid numbers
              const position: LatLngExpression = [
                typeof docLat === 'number' && !isNaN(docLat) ? docLat : validLat,
                typeof docLon === 'number' && !isNaN(docLon) ? docLon : validLon
              ];
              
              return (
                <Marker
                  key={doctor.id}
                  position={position}
                  icon={selectedDoctorId === doctor.id ? selectedIcon : defaultIcon}
                  eventHandlers={{
                    click: () => handleDoctorSelect(doctor.id)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{doctor.full_name}</p>
                      <p>{doctor.city || 'Unknown location'}</p>
                      <p>{doctor.license_number}</p>
                      {doctor.hours && <p>{doctor.hours}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default DoctorListSection;
