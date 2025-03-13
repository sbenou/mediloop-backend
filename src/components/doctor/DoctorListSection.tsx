
import { Card } from "@/components/ui/card";
import DoctorCard from "@/components/doctor/DoctorCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from "react";
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

// Simple map updater component
function MapUpdater({ coordinates }: { coordinates: { lat: number; lon: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (map && coordinates) {
      try {
        map.setView([coordinates.lat, coordinates.lon], 13);
      } catch (error) {
        console.error("Error updating map view:", error);
      }
    }
  }, [coordinates, map]);
  
  return null;
}

interface Doctor {
  id: string;
  full_name: string;
  city: string;
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

  // Refresh the map when coordinates change
  useEffect(() => {
    setMapKey(`doctormap-${Date.now()}`);
  }, [coordinates?.lat, coordinates?.lon]);

  if (!coordinates) {
    return <div>Loading location...</div>;
  }

  const centerPosition: LatLngExpression = [coordinates.lat, coordinates.lon];

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    listItemRefs.current[doctorId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

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

        {doctors?.map((doctor) => (
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
              onConnect={() => onConnect(doctor.id, doctor.source || 'database')}
              isSelected={selectedDoctorId === doctor.id}
            />
          </div>
        ))}

        {doctors?.length === 0 && coordinates && !isLoading && (
          <p className="text-center text-gray-500">No doctors found in this area</p>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
        <MapContainer
          key={mapKey}
          center={centerPosition}
          zoom={10}
          className="h-full"
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater coordinates={coordinates} />
          
          {showUserLocation && (
            <Marker 
              position={centerPosition} 
              key="user-location"
              icon={userLocationIcon}
            >
              <Popup>Your location</Popup>
            </Marker>
          )}

          {doctors?.filter(doctor => doctor.coordinates).map((doctor) => {
            const position: LatLngExpression = [
              doctor.coordinates?.lat || coordinates.lat,
              doctor.coordinates?.lon || coordinates.lon
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
                    <p>{doctor.city}</p>
                    <p>{doctor.license_number}</p>
                    {doctor.hours && <p>{doctor.hours}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default DoctorListSection;
