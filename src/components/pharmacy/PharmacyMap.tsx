
import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, MapPinOff } from 'lucide-react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { userLocationState, isUsingLocationState } from '@/store/location/atoms';
import { Button } from '@/components/ui/button';
import { getCoordinatesWithMapbox, getDistanceFromUserToPharmacy, getMapboxToken } from '@/services/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

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
  const [mapError, setMapError] = useState<string | null>(null);
  const [hasRendered, setHasRendered] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const userLocation = useRecoilValue(userLocationState);
  const setUserLocation = useSetRecoilState(userLocationState);
  const isUsingLocation = useRecoilValue(isUsingLocationState);
  const setIsUsingLocation = useSetRecoilState(isUsingLocationState);
  
  // Set rendered flag after first render
  useEffect(() => {
    setHasRendered(true);
  }, []);
  
  // Get Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('Fetching Mapbox token...');
        const token = await getMapboxToken();
        
        if (token) {
          console.log('Received token:', token ? 'Valid token' : 'No token');
          setMapboxToken(token);
          mapboxgl.accessToken = token;
        } else {
          throw new Error('Invalid token received');
        }
      } catch (error) {
        console.error('Error setting Mapbox token:', error);
        setMapError('Failed to load map resources');
        
        // Always set a fallback token
        const fallbackToken = 'pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA';
        console.log('Using fallback token');
        setMapboxToken(fallbackToken);
        mapboxgl.accessToken = fallbackToken;
      }
    };
    
    fetchMapboxToken();
  }, []);

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
  }, [pharmacy]);
  
  // Initialize map when token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current || !hasRendered || mapInitialized) {
      return;
    }
    
    console.log('Initializing Mapbox map with token');
    setMapInitialized(true);
    
    try {
      // Force explicit height and ensure container is visible
      if (mapContainer.current) {
        mapContainer.current.style.height = '200px';
        mapContainer.current.style.width = '100%';
        mapContainer.current.style.display = 'block';
        mapContainer.current.style.visibility = 'visible';
      }
      
      // Initialize map with default center
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [6.1296, 49.8153], // Luxembourg center as default
        zoom: 13,
        attributionControl: false,
        interactive: true,
        antialias: true
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      
      // Set loaded state when map is ready
      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
        setIsMapLoaded(true);
        setMapError(null);
        
        // Force resize after load to ensure proper rendering
        setTimeout(() => {
          if (map.current) map.current.resize();
        }, 200);
      });
      
      map.current.on('error', (e) => {
        console.error('Mapbox map error:', e);
        setMapError('Error loading map');
      });
    } catch (error) {
      console.error('Error creating Mapbox map:', error);
      setMapError('Failed to initialize map');
    }
  }, [mapboxToken, hasRendered, mapInitialized]);
  
  // Calculate distance when user location or pharmacy coordinates change
  useEffect(() => {
    if (userLocation && pharmacyCoordinates && isUsingLocation) {
      setIsCalculatingDistance(true);
      
      try {
        const distanceValue = getDistanceFromUserToPharmacy(userLocation, pharmacyCoordinates);
        console.log('Distance calculated:', distanceValue);
        setDistance(distanceValue);
      } catch (error) {
        console.error('Error calculating distance:', error);
        setDistance(null);
      } finally {
        setIsCalculatingDistance(false);
      }
    } else if (!isUsingLocation) {
      setDistance(null);
    }
  }, [userLocation, pharmacyCoordinates, isUsingLocation]);
  
  // Get user's location when isUsingLocation changes to true
  useEffect(() => {
    if (isUsingLocation && navigator.geolocation) {
      setIsCalculatingDistance(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          
          console.log('User location obtained:', newUserLocation);
          setUserLocation(newUserLocation);
          setIsCalculatingDistance(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsUsingLocation(false);
          setIsCalculatingDistance(false);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Could not access your location. Please check your browser permissions.",
          });
        }
      );
    }
  }, [isUsingLocation, setUserLocation, setIsUsingLocation]);
  
  // Update markers when coordinates or map changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) {
      console.log('Map not ready or not loaded yet');
      return;
    }
    
    console.log('Updating map markers with pharmacy coordinates:', pharmacyCoordinates);
    console.log('User location:', userLocation);
    
    // Request an animation frame to ensure the map container is rendered
    requestAnimationFrame(() => {
      if (!map.current) return;
      
      // Force map resize to ensure proper display
      map.current.resize();
      
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
        try {
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
          
          console.log('Added pharmacy marker at:', [pharmacyCoordinates.lng, pharmacyCoordinates.lat]);
        } catch (error) {
          console.error('Error adding pharmacy marker:', error);
        }
      }
      
      // Add user location marker if available
      if (userLocation && isUsingLocation) {
        try {
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
            
          console.log('Added user marker at:', [userLocation.lon, userLocation.lat]);
        } catch (error) {
          console.error('Error adding user marker:', error);
        }
      }
    });
  }, [pharmacyCoordinates, userLocation, isMapLoaded, pharmacy, isUsingLocation]);
  
  // Handle location toggle
  const handleLocationToggle = (checked: boolean) => {
    setIsUsingLocation(checked);
    
    if (!checked) {
      setDistance(null);
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className="h-[200px] rounded-md overflow-hidden border border-gray-200 relative bg-gray-100"
      >
        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-4">
              <MapPinOff className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600 mt-1">{mapError}</p>
            </div>
          </div>
        ) : (
          <div 
            ref={mapContainer} 
            className="absolute inset-0"
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'absolute',
              minHeight: '200px'
            }}
          />
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col">
          {isCalculatingDistance ? (
            <p className="text-sm font-medium text-primary">
              Calculating distance...
            </p>
          ) : isUsingLocation && distance ? (
            <p className="text-sm font-medium text-primary">
              Distance: {distance}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Share your location to see distance
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="location-toggle" className="text-xs mr-2">
            {isUsingLocation ? 'Using location' : 'Share location'}
          </Label>
          <Switch
            id="location-toggle"
            checked={isUsingLocation}
            onCheckedChange={handleLocationToggle}
            disabled={isCalculatingDistance}
          />
        </div>
      </div>
    </div>
  );
};

export default PharmacyMap;
