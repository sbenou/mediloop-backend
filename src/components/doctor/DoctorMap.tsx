
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '@/services/mapbox';
import { toast } from '@/components/ui/use-toast';

// Fallback token in case the Edge Function fails
const FALLBACK_TOKEN = 'pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA';

// Default coordinates for Luxembourg
const DEFAULT_COORDINATES = { lat: 49.8153, lng: 6.1296 };

interface Doctor {
  id: string;
  full_name: string;
  address?: string;
  city?: string | null;
  coordinates?: { lat: number; lon: number } | null;
}

export interface DoctorMapProps {
  doctors: Array<Doctor>;
  userCoordinates?: { lat: number; lon: number } | null;
  showUserLocation?: boolean;
  onDoctorSelect?: (doctorId: string) => void;
}

// Additional prop types for the single doctor use case
export interface SingleDoctorMapProps {
  doctor: {
    id: string;
    name: string;
    address: string;
    city: string;
    postal_code: string;
  };
}

const DoctorMap = ({
  doctors = [],
  userCoordinates = null,
  showUserLocation = false,
  onDoctorSelect,
  ...props
}: DoctorMapProps | SingleDoctorMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // Handle the case of a single doctor passed as prop
  const doctorsArray = React.useMemo(() => {
    // If 'doctor' prop exists (SingleDoctorMapProps), convert it to the expected format
    if ('doctor' in props && props.doctor) {
      const doctor = props.doctor;
      return [{
        id: doctor.id,
        full_name: doctor.name,
        address: doctor.address,
        city: doctor.city,
        // For single doctor map, we don't have coordinates, 
        // so we'll geocode the address later or center on a default location
      }];
    }
    return doctors;
  }, [doctors, props]);

  // Get Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        console.log('Fetching Mapbox token...');
        const token = await getMapboxToken();
        
        if (token) {
          setMapboxToken(token);
          mapboxgl.accessToken = token;
        } else {
          // Use fallback token
          console.warn('Using fallback Mapbox token');
          setMapboxToken(FALLBACK_TOKEN);
          mapboxgl.accessToken = FALLBACK_TOKEN;
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        // Use fallback token on error
        setMapboxToken(FALLBACK_TOKEN);
        mapboxgl.accessToken = FALLBACK_TOKEN;
      }
    };
    
    fetchMapboxToken();
  }, []);

  // Initialize map once token is available
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || map.current || mapInitialized) {
      return;
    }

    const initializeMap = () => {
      if (!mapContainer.current) return;
      
      try {
        console.log('Initializing map with token:', mapboxToken);
        
        // Set explicit height/width to ensure container is visible
        mapContainer.current.style.height = '400px';
        mapContainer.current.style.minHeight = '400px';
        mapContainer.current.style.width = '100%';
        
        // Initialize map with default center
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [DEFAULT_COORDINATES.lng, DEFAULT_COORDINATES.lat],
          zoom: 12,
          attributionControl: false,
        });
        
        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        
        // Handle map load
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setIsMapLoaded(true);
          setMapError(null);
          
          // Force resize to ensure proper rendering
          setTimeout(() => {
            if (map.current) map.current.resize();
          }, 200);
        });
        
        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Map error:', e);
          setMapError('Error loading map');
        });
        
        setMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map');
      }
    };

    initializeMap();
  }, [mapboxToken, mapInitialized]);

  // Update markers when doctors or user location changes
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    if (userMarker.current) {
      userMarker.current.remove();
      userMarker.current = null;
    }
    
    // Coordinates for map bounds
    const bounds = new mapboxgl.LngLatBounds();
    
    // Add doctor markers
    doctorsArray.forEach(doctor => {
      if (doctor.coordinates?.lat && doctor.coordinates?.lon) {
        try {
          const popupContent = document.createElement('div');
          popupContent.className = 'p-2';
          popupContent.innerHTML = `
            <div class="text-sm font-medium">${doctor.full_name}</div>
            ${doctor.address ? `<div class="text-xs">${doctor.address}</div>` : ''}
            ${doctor.city ? `<div class="text-xs">${doctor.city}</div>` : ''}
          `;
          
          // Add button if onDoctorSelect is provided
          if (onDoctorSelect) {
            const button = document.createElement('button');
            button.className = 'mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded';
            button.innerText = 'Select';
            button.onclick = () => onDoctorSelect(doctor.id);
            popupContent.appendChild(button);
          }
          
          const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);
          
          const marker = new mapboxgl.Marker()
            .setLngLat([doctor.coordinates.lon, doctor.coordinates.lat])
            .setPopup(popup)
            .addTo(map.current!);
          
          markers.current.push(marker);
          
          // Add to bounds
          bounds.extend([doctor.coordinates.lon, doctor.coordinates.lat]);
        } catch (error) {
          console.error('Error creating doctor marker:', error);
        }
      } else if ('doctor' in props && map.current) {
        // For single doctor view without coordinates, center on default location
        // You could potentially call a geocoding service here to get coordinates from the address
        map.current.flyTo({
          center: [DEFAULT_COORDINATES.lng, DEFAULT_COORDINATES.lat],
          zoom: 13
        });
      }
    });
    
    // Add user location marker if available
    if (showUserLocation && userCoordinates) {
      try {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#3b82f6';
        el.style.border = '2px solid white';
        
        userMarker.current = new mapboxgl.Marker(el)
          .setLngLat([userCoordinates.lon, userCoordinates.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your location'))
          .addTo(map.current!);
        
        // Add user location to bounds
        bounds.extend([userCoordinates.lon, userCoordinates.lat]);
      } catch (error) {
        console.error('Error creating user marker:', error);
      }
    }
    
    // Fit bounds if we have markers
    if (!bounds.isEmpty() && map.current) {
      try {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      } catch (error) {
        console.error('Error fitting bounds:', error);
        
        // Fallback to center on user or default
        if (userCoordinates) {
          map.current.flyTo({
            center: [userCoordinates.lon, userCoordinates.lat],
            zoom: 12
          });
        }
      }
    }
  }, [doctorsArray, userCoordinates, showUserLocation, isMapLoaded, onDoctorSelect, props]);

  // Recenter map on user button
  const handleCenterOnUser = () => {
    if (!map.current || !userCoordinates) return;
    
    map.current.flyTo({
      center: [userCoordinates.lon, userCoordinates.lat],
      zoom: 13,
      essential: true
    });
    
    toast({
      title: "Map Centered",
      description: "The map has been centered on your location",
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden relative border border-gray-200">
      {mapError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
          <MapPin className="h-8 w-8 text-gray-400" />
          <p className="mt-2 text-gray-600">{mapError}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => setMapInitialized(false)}
          >
            Retry Loading Map
          </Button>
        </div>
      ) : (
        <>
          <div 
            ref={mapContainer} 
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
          />
          
          {showUserLocation && userCoordinates && (
            <Button
              className="absolute bottom-4 right-4 z-10"
              size="sm"
              onClick={handleCenterOnUser}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Center on Me
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorMap;
