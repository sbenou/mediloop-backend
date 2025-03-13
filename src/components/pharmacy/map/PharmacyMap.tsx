
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapUpdater } from './MapUpdater';
import { useState, useEffect } from 'react';

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
    filteredCount: filteredPharmacies?.length || 0,
    leafletLoaded: typeof L !== 'undefined',
    reactLeafletLoaded: typeof MapContainer !== 'undefined'
  });
  
  // Set default center position
  const defaultCenter: [number, number] = [49.8153, 6.1296]; // Luxembourg
  const centerCoords = coordinates?.lat && coordinates?.lon 
    ? [coordinates.lat, coordinates.lon] as [number, number]
    : defaultCenter;
  
  console.log('PharmacyMap: center coordinates', centerCoords);
  
  // Add key state to force re-render when needed
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  
  useEffect(() => {
    console.log('PharmacyMap: coordinates changed, updating map key');
    setMapKey(`map-${centerCoords[0]}-${centerCoords[1]}-${Date.now()}`);
  }, [centerCoords[0], centerCoords[1]]);

  // Ensure children are properly handled
  const mapChildren = [
    <TileLayer
      key="tile-layer"
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    />,
    <MapUpdater 
      key="map-updater"
      coordinates={coordinates} 
      pharmacies={pharmacies || []}
      onPharmaciesInShape={onPharmaciesInShape}
      showDefaultLocation={showDefaultLocation}
      defaultZoom={10}
    />
  ];

  // Add user location marker if needed
  if (showDefaultLocation && coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lon === 'number') {
    mapChildren.push(
      <Marker 
        key="user-location" 
        position={[coordinates.lat, coordinates.lon]}
      >
        <Popup>Your location</Popup>
      </Marker>
    );
  }

  // Add pharmacy markers
  if (Array.isArray(filteredPharmacies)) {
    filteredPharmacies.forEach((pharmacy, index) => {
      if (!pharmacy || !pharmacy.coordinates || 
          typeof pharmacy.coordinates.lat !== 'number' || 
          typeof pharmacy.coordinates.lon !== 'number') {
        return;
      }
      
      mapChildren.push(
        <Marker
          key={`pharmacy-${pharmacy.id || index}`}
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
    });
  }
  
  console.log('PharmacyMap: rendering with children count:', mapChildren.length);
  
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
      <MapContainer
        key={mapKey}
        center={centerCoords}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full"
        style={{ height: '100%', width: '100%' }}
      >
        {mapChildren}
      </MapContainer>
    </div>
  );
}
