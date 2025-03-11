
import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import { Button } from '@/components/ui/button';
import { getCoordinatesWithMapbox, getDistanceFromUserToPharmacy } from '@/services/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const pharmacyMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [pharmacyCoordinates, setPharmacyCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const userLocation = useRecoilValue(userLocationState);
  
  // Get Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const response = await fetch('/api/get-mapbox-token');
        if (response.ok) {
          const { token } = await response.json();
          if (token) {
            setMapboxToken(token);
            mapboxgl.accessToken = token;
          } else {
            throw new Error('Invalid token received');
          }
        } else {
          throw new Error(`Failed to fetch token: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Use a fallback token for development - this should be replaced with proper error handling
        const fallbackToken = 'pk.eyJ1IjoiZGVtby1hY2NvdW50IiwiYSI6ImNscHdkZjBiODJ0NTMyaW1yOWdoN2FvdW8ifQ.r_qpHhn0rJd-SgGhNfRw1A';
        setMapboxToken(fallbackToken);
        mapboxgl.accessToken = fallbackToken;
      }
    };
    
    fetchMapboxToken();
  }, []);
  
  // Initialize map when token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current) return;
    
    console.log('Initializing Mapbox map with token:', mapboxToken);
    
    // Initialize map with default center
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [6.1296, 49.8153], // Luxembourg center as default
      zoom: 13,
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Set loaded state when map is ready
    map.current.on('load', () => {
      console.log('Mapbox map loaded');
      setIsMapLoaded(true);
    });
    
    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);
  
  // Get pharmacy coordinates based on address
  useEffect(() => {
    const getPharmacyCoordinates = async () => {
      if (!pharmacy) return;
      
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
            setIsCalculatingDistance(true);
            const distanceValue = getDistanceFromUserToPharmacy(userLocation, coords);
            setDistance(distanceValue);
            setIsCalculatingDistance(false);
          }
          return;
        }
        
        console.log('Fetching pharmacy coordinates for:', pharmacy.address);
        const fullQuery = `${pharmacy.address}, ${pharmacy.city} ${pharmacy.postal_code}`;
        
        // First try with full address
        let coordinates = await getCoordinatesWithMapbox(fullQuery);
        
        // If first request fails, try with just city and postal code
        if (!coordinates) {
          console.log('No results found with full address, trying with city and postal code');
          const simplifiedQuery = `${pharmacy.city} ${pharmacy.postal_code}`;
          coordinates = await getCoordinatesWithMapbox(simplifiedQuery);
        }
        
        if (coordinates) {
          console.log('Found coordinates:', coordinates);
          
          // Cache the coordinates
          sessionStorage.setItem(cacheKey, JSON.stringify(coordinates));
          setPharmacyCoordinates(coordinates);
          
          // Calculate distance if user location is available
          if (userLocation) {
            setIsCalculatingDistance(true);
            const distanceValue = getDistanceFromUserToPharmacy(userLocation, coordinates);
            setDistance(distanceValue);
            setIsCalculatingDistance(false);
          }
        } else {
          console.error('No location found for address:', fullQuery);
          
          // Use city-specific fallback if available
          const cityLower = pharmacy.city.toLowerCase();
          const fallbackCoords = DEFAULT_COORDINATES[cityLower as keyof typeof DEFAULT_COORDINATES] 
            || DEFAULT_COORDINATES.luxembourg;
            
          console.log(`Using default coordinates for ${pharmacy.city}`);
          setPharmacyCoordinates(fallbackCoords);
        }
      } catch (error) {
        console.error('Error fetching pharmacy coordinates:', error);
        // Default coordinates for Luxembourg as fallback
        setPharmacyCoordinates(DEFAULT_COORDINATES.luxembourg);
      }
    };
    
    getPharmacyCoordinates();
  }, [pharmacy, userLocation]);
  
  // Update markers when coordinates or map changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    // Clear existing markers
    if (pharmacyMarker.current) {
      pharmacyMarker.current.remove();
      pharmacyMarker.current = null;
    }
    
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }
    
    // Add pharmacy marker and fly to it
    if (pharmacyCoordinates) {
      // Create pharmacy marker
      const el = document.createElement('div');
      el.className = 'pharmacy-marker';
      el.style.width = '25px';
      el.style.height = '25px';
      el.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
      el.style.backgroundSize = 'contain';
      
      pharmacyMarker.current = new mapboxgl.Marker(el)
        .setLngLat([pharmacyCoordinates.lng, pharmacyCoordinates.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="text-sm font-medium">${pharmacy.name}</div><div class="text-xs">${pharmacy.address}</div>`))
        .addTo(map.current);
      
      // Fly to pharmacy location
      map.current.flyTo({
        center: [pharmacyCoordinates.lng, pharmacyCoordinates.lat],
        zoom: 15,
        essential: true
      });
    }
    
    // Add user location marker if available
    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '2px solid white';
      
      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lon, userLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your location'))
        .addTo(map.current);
    }
  }, [pharmacyCoordinates, userLocation, isMapLoaded, pharmacy]);
  
  // Handle getting user's current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by your browser');
      return;
    }
    
    setIsCalculatingDistance(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        
        // Recalculate distance if pharmacy coordinates exist
        if (pharmacyCoordinates) {
          const distanceValue = getDistanceFromUserToPharmacy(coords, pharmacyCoordinates);
          setDistance(distanceValue);
        }
        
        setIsCalculatingDistance(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsCalculatingDistance(false);
      }
    );
  };

  if (!mapboxToken) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-200 h-32 rounded-md flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-600 mt-1">Loading map token...</p>
          </div>
        </div>
        <p className="text-sm text-center">{pharmacy.address}, {pharmacy.city} {pharmacy.postal_code}</p>
      </div>
    );
  }

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
      <div className="h-[200px] rounded-md overflow-hidden border border-gray-200 relative">
        <div 
          ref={mapContainer} 
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
          className="w-full h-full"
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <p className="text-sm text-center">{pharmacy.address}, {pharmacy.city} {pharmacy.postal_code}</p>
        
        {isCalculatingDistance ? (
          <p className="text-sm font-medium text-center text-primary">
            Calculating distance...
          </p>
        ) : distance ? (
          <p className="text-sm font-medium text-center text-primary">
            Distance: {distance}
          </p>
        ) : null}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 text-xs" 
          onClick={handleGetCurrentLocation}
          disabled={isCalculatingDistance}
        >
          <Navigation className="h-3 w-3 mr-1" />
          {isCalculatingDistance ? 'Getting location...' : 'Get current location'}
        </Button>
      </div>
    </div>
  );
};

export default PharmacyMap;
