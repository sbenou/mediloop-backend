
import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from "@/components/ui/use-toast";
import { SimplifiedMapUpdater } from './SimplifiedMapUpdater';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation 
}: PharmacyMapProps) {
  // Default center position for Luxembourg
  const defaultCenter: [number, number] = [49.8153, 6.1296];
  const centerCoords: [number, number] = coordinates?.lat && coordinates?.lon 
    ? [coordinates.lat, coordinates.lon] 
    : defaultCenter;
  
  // Add key state to force re-render when needed
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  
  useEffect(() => {
    // Force re-render of the map when coordinates change
    setMapKey(`map-${Date.now()}`);
  }, [coordinates?.lat, coordinates?.lon]);
  
  // Filter pharmacies for the manual drawing functionality
  useEffect(() => {
    if (!pharmacies || !Array.isArray(pharmacies)) return;
    
    if (showDefaultLocation && coordinates) {
      // When location is enabled, show pharmacies nearby
      try {
        const userLocation = coordinates ? L.latLng(coordinates.lat, coordinates.lon) : null;
        if (userLocation) {
          const nearbyPharmacies = pharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            try {
              const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
              return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
            } catch (error) {
              console.error('Error calculating distance for pharmacy:', pharmacy, error);
              return false;
            }
          });
          onPharmaciesInShape(nearbyPharmacies);
          
          if (nearbyPharmacies.length > 0) {
            toast({
              title: "Location Used",
              description: `Found ${nearbyPharmacies.length} pharmacies within 2km`,
            });
          }
        }
      } catch (error) {
        console.error('Error filtering pharmacies by location:', error);
      }
    } else {
      // When no location filter, show all pharmacies
      onPharmaciesInShape(pharmacies);
    }
  }, [showDefaultLocation, coordinates, pharmacies, onPharmaciesInShape]);
  
  // Render pharmacy markers
  const renderPharmacyMarkers = () => {
    if (!Array.isArray(filteredPharmacies)) return null;
    
    return filteredPharmacies.map((pharmacy, index) => {
      if (!pharmacy || !pharmacy.coordinates || 
          typeof pharmacy.coordinates.lat !== 'number' || 
          typeof pharmacy.coordinates.lon !== 'number') {
        return null;
      }
      
      return (
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
  };
  
  // Render the user location marker if needed
  const renderUserLocationMarker = () => {
    if (showDefaultLocation && coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lon === 'number') {
      return (
        <Marker 
          position={[coordinates.lat, coordinates.lon]}
          key="user-location"
          icon={userLocationIcon}
        >
          <Popup>Your location</Popup>
        </Marker>
      );
    }
    return null;
  };
  
  console.log('PharmacyMap: rendering', { 
    hasCoordinates: !!coordinates,
    pharmCount: pharmacies?.length || 0,
    filteredCount: filteredPharmacies?.length || 0,
    leafletLoaded: typeof L !== 'undefined',
    reactLeafletLoaded: typeof MapContainer !== 'undefined'
  });
  
  console.log('PharmacyMap: center coordinates', centerCoords);
  
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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SimplifiedMapUpdater coordinates={coordinates} />
        
        {renderUserLocationMarker()}
        {renderPharmacyMarkers()}
      </MapContainer>
    </div>
  );
}
