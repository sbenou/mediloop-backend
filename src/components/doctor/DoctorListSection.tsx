import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import DoctorCard from "@/components/doctor/DoctorCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom marker icons
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const doctorLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ coordinates }: { coordinates: { lat: number; lon: number } }) {
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
          center={[coordinates.lat, coordinates.lon] as [number, number]}
          zoom={13}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater coordinates={coordinates} />
          
          <Marker 
            position={[coordinates.lat, coordinates.lon] as [number, number]}
            icon={userLocationIcon}
          >
            <Popup>Your location</Popup>
          </Marker>

          {doctors?.map((doctor) => (
            <Marker
              key={doctor.id}
              position={[
                doctor.coordinates?.lat || coordinates.lat,
                doctor.coordinates?.lon || coordinates.lon
              ] as [number, number]}
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
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default DoctorListSection;