
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import { calculateDistance } from '@/lib/utils/distance';
import { Button } from '@/components/ui/button';

interface PharmacyMapProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
  };
}

const PharmacyMap: React.FC<PharmacyMapProps> = ({ pharmacy }) => {
  const [pharmacyCoordinates, setPharmacyCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const userLocation = useRecoilValue(userLocationState);
  
  // Get pharmacy coordinates based on address
  useEffect(() => {
    const getPharmacyCoordinates = async () => {
      try {
        const query = `${pharmacy.address}, ${pharmacy.city} ${pharmacy.postal_code}`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          setPharmacyCoordinates(coords);
          
          // Calculate distance if user location is available
          if (userLocation) {
            const distanceValue = calculateDistance(
              userLocation.lat, 
              userLocation.lon, 
              coords.lat, 
              coords.lng
            );
            setDistance(distanceValue);
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy coordinates:', error);
      }
    };
    
    getPharmacyCoordinates();
  }, [pharmacy, userLocation]);

  // Handle getting user's current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        
        // Recalculate distance if pharmacy coordinates exist
        if (pharmacyCoordinates) {
          const distanceValue = calculateDistance(
            coords.lat, 
            coords.lon, 
            pharmacyCoordinates.lat, 
            pharmacyCoordinates.lng
          );
          setDistance(distanceValue);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  if (!pharmacyCoordinates) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-200 h-32 rounded-md flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 mt-1">Loading map location...</p>
          </div>
        </div>
        <p className="text-sm text-center">{pharmacy.address}, {pharmacy.city} {pharmacy.postal_code}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[200px] rounded-md overflow-hidden border border-gray-200">
        <MapContainer
          center={[pharmacyCoordinates.lat, pharmacyCoordinates.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => setIsMapLoaded(true)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Pharmacy Marker */}
          <Marker position={[pharmacyCoordinates.lat, pharmacyCoordinates.lng]}>
            <Popup>
              <div className="text-sm font-medium">{pharmacy.name}</div>
              <div className="text-xs">{pharmacy.address}</div>
            </Popup>
          </Marker>
          
          {/* User location marker (if available) */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lon]}>
              <Popup>Your location</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-center">{pharmacy.address}, {pharmacy.city} {pharmacy.postal_code}</p>
        
        {distance && (
          <p className="text-sm font-medium text-center text-primary">
            Distance: {distance}
          </p>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 text-xs" 
          onClick={handleGetCurrentLocation}
        >
          <Navigation className="h-3 w-3 mr-1" />
          Get current location
        </Button>
      </div>
    </div>
  );
};

export default PharmacyMap;
