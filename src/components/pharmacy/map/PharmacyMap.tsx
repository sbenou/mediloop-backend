
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
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
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function PharmacyMap({ coordinates, pharmacies, filteredPharmacies, onPharmaciesInShape, showDefaultLocation }: PharmacyMapProps) {
  console.log('PharmacyMap: rendering', { 
    hasCoordinates: !!coordinates,
    pharmCount: pharmacies?.length || 0,
    filteredCount: filteredPharmacies?.length || 0
  });
  
  // Set default center position
  const defaultCenter: [number, number] = [49.8153, 6.1296]; // Luxembourg
  const centerCoords = coordinates?.lat && coordinates?.lon 
    ? [coordinates.lat, coordinates.lon] as [number, number]
    : defaultCenter;
  
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
      <MapContainer
        center={centerCoords}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        
        <MapUpdater 
          coordinates={coordinates} 
          pharmacies={pharmacies || []}
          onPharmaciesInShape={onPharmaciesInShape}
          showDefaultLocation={showDefaultLocation}
          defaultZoom={10}
        />
        
        {showDefaultLocation && coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number' && (
          <Marker position={[coordinates.lat, coordinates.lon]}>
            <Popup>Your location</Popup>
          </Marker>
        )}

        {Array.isArray(filteredPharmacies) && filteredPharmacies.map((pharmacy) => {
          if (!pharmacy || !pharmacy.coordinates || 
              typeof pharmacy.coordinates.lat !== 'number' || 
              typeof pharmacy.coordinates.lon !== 'number') {
            return null;
          }
          
          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</p>
                  <p>{pharmacy.address || 'Address not available'}</p>
                  <p>{pharmacy.hours || 'Hours not available'}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
