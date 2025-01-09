import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import DoctorCard from "@/components/doctor/DoctorCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Map as LeafletMap, LatLngTuple, Icon, DivIcon } from 'leaflet';

// Create custom marker icons using divIcon for better customization
const userLocationIcon: DivIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const doctorLocationIcon: DivIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface MapUpdaterProps {
  coordinates: { lat: number; lon: number };
}

function MapUpdater({ coordinates }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lon], 13);
  }, [coordinates, map]);
  
  return null;
}

interface DoctorListSectionProps {
  doctors: any[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number } | null;
  onConnect: (doctorId: string, source?: 'database' | 'overpass') => void;
}

const DoctorListSection = ({
  doctors,
  isLoading,
  coordinates,
  onConnect,
}: DoctorListSectionProps) => {
  if (!coordinates) {
    return <div>Loading location...</div>;
  }

  const center: LatLngTuple = [coordinates.lat, coordinates.lon];

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
          <DoctorCard
            key={doctor.id}
            {...doctor}
            onConnect={() => onConnect(doctor.id, doctor.source)}
          />
        ))}

        {doctors?.length === 0 && coordinates && !isLoading && (
          <p className="text-center text-gray-500">No doctors found in this area</p>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
        <MapContainer
          className="h-full"
          style={{ height: '100%', width: '100%' }}
          center={center}
          zoom={13}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater coordinates={coordinates} />
          
          <Marker 
            position={center}
            icon={userLocationIcon}
          >
            <Popup>Your location</Popup>
          </Marker>

          {doctors?.map((doctor) => {
            const position: LatLngTuple = [
              doctor.coordinates?.lat || coordinates.lat,
              doctor.coordinates?.lon || coordinates.lon
            ];
            return (
              <Marker
                key={doctor.id}
                position={position}
                icon={doctorLocationIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{doctor.full_name}</p>
                    <p>{doctor.address}</p>
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