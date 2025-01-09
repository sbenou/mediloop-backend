import { Card } from "@/components/ui/card";
import PharmacyCard from "@/components/PharmacyCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from "react";

// Fix for default marker icons in Leaflet with Vite
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapUpdater({ coordinates }: { coordinates: { lat: number; lon: number } }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([coordinates.lat, coordinates.lon], 13);
  }, [coordinates, map]);
  
  return null;
}

interface PharmacyListSectionProps {
  pharmacies: any[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number } | null;
  defaultPharmacyId: string | null;
  onPharmacySelect: (pharmacyId: string) => void;
  onSetDefaultPharmacy: (pharmacyId: string, isDefault: boolean) => void;
}

const PharmacyListSection = ({
  pharmacies,
  isLoading,
  coordinates,
  defaultPharmacyId,
  onPharmacySelect,
  onSetDefaultPharmacy
}: PharmacyListSectionProps) => {
  if (!coordinates) {
    return <div>Loading location...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
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

        {pharmacies?.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            {...pharmacy}
            onSelect={onPharmacySelect}
            onSetDefault={onSetDefaultPharmacy}
            isDefault={defaultPharmacyId === pharmacy.id}
          />
        ))}

        {pharmacies?.length === 0 && coordinates && !isLoading && (
          <p className="text-center text-gray-500">No pharmacies found in this area</p>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
        <MapContainer
          center={[coordinates.lat, coordinates.lon] as L.LatLngExpression}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater coordinates={coordinates} />
          
          {/* User location marker */}
          <Marker 
            position={[coordinates.lat, coordinates.lon] as L.LatLngExpression}
          >
            <Popup>Your location</Popup>
          </Marker>

          {/* Pharmacy markers */}
          {pharmacies?.map((pharmacy) => (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon] as L.LatLngExpression}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{pharmacy.name}</p>
                  <p>{pharmacy.address}</p>
                  <p>{pharmacy.hours}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default PharmacyListSection;