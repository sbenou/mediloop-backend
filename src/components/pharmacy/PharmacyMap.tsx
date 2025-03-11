import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import { calculateDistance } from '@/lib/utils/distance';
import { Button } from '@/components/ui/button';
import L from 'leaflet';

// Create a MapController component to set the view once the map is initialized
const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, map, zoom]);
  
  return null;
};

interface PharmacyMapProps {
  pharmacy: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
  };
}

// Default coordinates for common locations in case geocoding fails
const DEFAULT_COORDINATES = {
  // Luxembourg as general fallback
  'luxembourg': { lat: 49.8153, lng: 6.1296 },
  // Additional cities for better fallbacks
  'luxembourg city': { lat: 49.6116, lng: 6.1319 },
  'dudelange': { lat: 49.4783, lng: 6.0844 },
  'esch-sur-alzette': { lat: 49.4941, lng: 5.9806 },
  'differdange': { lat: 49.5242, lng: 5.8903 }
};

const PharmacyMap: React.FC<PharmacyMapProps> = ({ pharmacy }) => {
  const [pharmacyCoordinates, setPharmacyCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const userLocation = useRecoilValue(userLocationState);
  
  // Fix Leaflet icon issues in browser environments
  useEffect(() => {
    // Only run this in browser environment
    if (typeof window !== 'undefined') {
      // Leaflet's default icon uses a marker that might 404, let's fix that
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    }
  }, []);
  
  // Get pharmacy coordinates based on address
  useEffect(() => {
    const getPharmacyCoordinates = async () => {
      try {
        // Cache check - this will help avoid unnecessary API calls
        const cacheKey = `pharmacy-coords-${pharmacy.address}-${pharmacy.city}-${pharmacy.postal_code}`;
        const cachedCoords = sessionStorage.getItem(cacheKey);
        
        if (cachedCoords) {
          console.log('Using cached pharmacy coordinates');
          const coords = JSON.parse(cachedCoords);
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
          return;
        }
        
        console.log('Fetching pharmacy coordinates for:', pharmacy.address);
        const query = `${pharmacy.address}, ${pharmacy.city} ${pharmacy.postal_code}`;
        
        // First try with full address
        let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        
        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }
        
        let data = await response.json();
        console.log('Geocoding response:', data);
        
        // If first request fails, try with just city and postal code
        if (!data || data.length === 0) {
          console.log('No results found with full address, trying with city and postal code');
          const simplifiedQuery = `${pharmacy.city} ${pharmacy.postal_code}`;
          response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedQuery)}&limit=1`);
          
          if (response.ok) {
            data = await response.json();
            console.log('Simplified geocoding response:', data);
          }
        }
        
        if (data && data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          console.log('Found coordinates:', coords);
          
          // Cache the coordinates
          sessionStorage.setItem(cacheKey, JSON.stringify(coords));
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
        } else {
          console.error('No location found for address:', query);
          
          // Use city-specific fallback if available
          const cityLower = pharmacy.city.toLowerCase();
          if (DEFAULT_COORDINATES[cityLower as keyof typeof DEFAULT_COORDINATES]) {
            console.log(`Using default coordinates for ${pharmacy.city}`);
            setPharmacyCoordinates(DEFAULT_COORDINATES[cityLower as keyof typeof DEFAULT_COORDINATES]);
          } else {
            // Default coordinates for Luxembourg as fallback
            console.log('Using default Luxembourg coordinates');
            setPharmacyCoordinates(DEFAULT_COORDINATES.luxembourg);
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy coordinates:', error);
        // Default coordinates for Luxembourg as fallback
        setPharmacyCoordinates(DEFAULT_COORDINATES.luxembourg);
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

  // Default values for map initialization
  const initialCenter: [number, number] = [49.8153, 6.1296]; // Luxembourg center
  const initialZoom = 13;

  return (
    <div className="space-y-3">
      <div className="h-[200px] rounded-md overflow-hidden border border-gray-200">
        <MapContainer 
          style={{ height: '100%', width: '100%' }}
          whenReady={() => {
            console.log('Map is ready!');
            setIsMapLoaded(true);
          }}
        >
          {/* This controller component will handle the view updates */}
          <MapController 
            center={[pharmacyCoordinates.lat, pharmacyCoordinates.lng]} 
            zoom={13} 
          />
          
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            // @ts-ignore - attribution is supported in react-leaflet
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
