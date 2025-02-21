
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapUpdater } from './MapUpdater';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function PharmacyMap({ coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation }: PharmacyMapProps) {
  // Default center of Luxembourg if no coordinates provided
  const center: L.LatLngExpression = [coordinates.lat || 49.8153, coordinates.lon || 6.1296];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
      <MapContainer
        className="h-full"
        style={{ height: '100%', width: '100%' }}
        center={center}
        zoom={11}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater 
          coordinates={coordinates} 
          pharmacies={pharmacies}
          onPharmaciesInShape={onPharmaciesInShape}
          showDefaultLocation={showDefaultLocation}
        />
        
        {showDefaultLocation && coordinates.lat && coordinates.lon && (
          <Marker position={[coordinates.lat, coordinates.lon]}>
            <Popup>Your location</Popup>
          </Marker>
        )}

        {pharmacies.map((pharmacy) => (
          pharmacy.coordinates && pharmacy.coordinates.lat && pharmacy.coordinates.lon && (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{pharmacy.name}</p>
                  <p>{pharmacy.address}</p>
                  <p>{pharmacy.hours}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
