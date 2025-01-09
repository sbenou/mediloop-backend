import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import PharmacyCard from "@/components/PharmacyCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';

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

const pharmacyLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapUpdater({ coordinates }: { coordinates: { lat: number; lon: number } }) {
  const map = useMap();
  
  useEffect(() => {
    const center: LatLngExpression = [coordinates.lat, coordinates.lon];
    map.setView(center, 13);
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

  const center: LatLngExpression = [coordinates.lat, coordinates.lon];

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

          {pharmacies?.map((pharmacy) => {
            const position: LatLngExpression = [pharmacy.coordinates.lat, pharmacy.coordinates.lon];
            return (
              <Marker
                key={pharmacy.id}
                position={position}
                icon={pharmacyLocationIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{pharmacy.name}</p>
                    <p>{pharmacy.address}</p>
                    <p>{pharmacy.hours}</p>
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

export default PharmacyListSection;