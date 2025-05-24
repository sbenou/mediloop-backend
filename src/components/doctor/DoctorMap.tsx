
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Search, Map } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Doctor {
  id: string;
  full_name: string;
  coordinates?: { lat: number; lon: number } | null;
  distance?: number;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

interface DoctorMapProps {
  doctors: Doctor[];
  userCoordinates: { lat: number; lon: number } | null;
  showUserLocation?: boolean;
  onDoctorSelect: (doctorId: string) => void;
}

const DoctorMap = ({
  doctors,
  userCoordinates,
  showUserLocation = false,
  onDoctorSelect
}: DoctorMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState<boolean>(true);

  // Get Mapbox token from localStorage or environment
  useEffect(() => {
    async function loadMapboxToken() {
      setIsLoadingToken(true);
      try {
        // Try to get token from environment variable first
        let token = import.meta.env.VITE_MAPBOX_TOKEN;
        
        // If not in env, try localStorage
        if (!token) {
          token = localStorage.getItem('mapbox_token') || '';
        }
        
        if (token) {
          setMapboxToken(token);
          
          // Store in localStorage for future use
          if (!localStorage.getItem('mapbox_token')) {
            localStorage.setItem('mapbox_token', token);
          }
        }
      } catch (error) {
        console.error("Error loading Mapbox token:", error);
      } finally {
        setIsLoadingToken(false);
      }
    }
    
    loadMapboxToken();
  }, []);

  // Initialize and render map
  useEffect(() => {
    // Check for mapbox token - without it, we can't show the map
    if (!mapboxToken) {
      console.error('Mapbox token is missing. Map cannot be displayed.');
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    if (!mapContainer.current) return;

    console.log('Initializing map with user coordinates:', userCoordinates);

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: userCoordinates 
        ? [userCoordinates.lon, userCoordinates.lat]
        : [6.1296, 49.8153], // Default to Luxembourg
      zoom: userCoordinates ? 12 : 9
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add user location marker if available
    if (showUserLocation && userCoordinates?.lat && userCoordinates?.lon) {
      console.log('Adding user location marker at:', userCoordinates);
      const userLocationMarker = document.createElement('div');
      userLocationMarker.className = 'absolute w-6 h-6 bg-blue-500 border-2 border-white rounded-full pulse';

      new mapboxgl.Marker({ 
        element: userLocationMarker,
        anchor: 'center' 
      })
        .setLngLat([userCoordinates.lon, userCoordinates.lat])
        .addTo(map.current);
    }

    return () => {
      // Clean up map instance
      map.current?.remove();
    };
  }, [userCoordinates, showUserLocation, mapboxToken]);

  // Add doctor markers to map
  useEffect(() => {
    if (!map.current || !mapboxToken) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Don't try to add markers until the map has loaded
    if (!map.current.loaded()) {
      map.current.on('load', addDoctorMarkers);
      return () => {
        if (map.current) {
          map.current.off('load', addDoctorMarkers);
        }
      };
    } else {
      addDoctorMarkers();
    }

    function addDoctorMarkers() {
      if (!map.current) return;
      
      console.log(`Adding ${doctors.length} doctor markers to map`);
      
      // Add markers for doctors with coordinates
      const doctorsWithCoordinates = doctors.filter(doctor => 
        doctor.coordinates?.lat && doctor.coordinates?.lon
      );
      
      console.log(`Filtered to ${doctorsWithCoordinates.length} doctors with valid coordinates`);
      
      doctorsWithCoordinates.forEach(doctor => {
        if (doctor.coordinates?.lat && doctor.coordinates?.lon) {
          const doctorLat = parseFloat(String(doctor.coordinates.lat));
          const doctorLon = parseFloat(String(doctor.coordinates.lon));
          
          if (isNaN(doctorLat) || isNaN(doctorLon)) {
            console.log(`Skipping doctor ${doctor.id} due to invalid coordinates`, doctor.coordinates);
            return;
          }
          
          // Get distance string if available
          let distanceStr = '';
          if (doctor.distance) {
            distanceStr = `(${doctor.distance} km)`;
          }
          
          // Create marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'cursor-pointer';
          markerElement.innerHTML = `
            <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
          `;

          // Create popup
          const popup = new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false,
            className: 'doctor-popup'
          }).setHTML(`
            <div class="p-2">
              <h3 class="text-sm font-medium">${doctor.full_name}</h3>
              <p class="text-xs text-gray-500">${doctor.city || ''}</p>
              <p class="text-xs text-gray-500">${distanceStr}</p>
            </div>
          `);

          // Create and add marker
          const marker = new mapboxgl.Marker({ element: markerElement })
            .setLngLat([doctorLon, doctorLat])
            .setPopup(popup)
            .addTo(map.current);
            
          // Add click handler
          markerElement.addEventListener('click', () => {
            console.log('Doctor marker clicked:', doctor.id);
            onDoctorSelect(doctor.id);
          });
          
          // Store marker for later cleanup
          markers.current.push(marker);
        }
      });
      
      console.log(`Added ${markers.current.length} markers to the map`);
    }
    
    // Fit map to markers if we have any
    if (markers.current.length > 0) {
      console.log('Fitting map to markers');
      const bounds = new mapboxgl.LngLatBounds();
      
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      // Add user location to bounds if available
      if (userCoordinates?.lat && userCoordinates?.lon) {
        bounds.extend([userCoordinates.lon, userCoordinates.lat]);
      }
      
      map.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 13,
        duration: 1000
      });
    } else if (doctors.length === 0) {
      console.log('No markers to add, centering map on default location or user location');
      // If no markers and no user coordinates, center on Luxembourg
      map.current.flyTo({
        center: userCoordinates 
          ? [userCoordinates.lon, userCoordinates.lat]
          : [6.1296, 49.8153],
        zoom: userCoordinates ? 12 : 9,
        duration: 1000
      });
    }
  }, [doctors, userCoordinates, onDoctorSelect, mapboxToken]);

  const handleSetToken = () => {
    setMapboxToken(tokenInput);
    localStorage.setItem('mapbox_token', tokenInput);
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border">
      {!mapboxToken ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100">
          <div className="text-center max-w-md space-y-4">
            <Map className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="text-xl font-semibold">Mapbox Token Required</h3>
            <p className="text-gray-600">
              Please enter your Mapbox public token to display the map.
              You can get one for free at <a href="https://mapbox.com/" className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">mapbox.com</a>
            </p>
            
            <div className="flex gap-2">
              <Input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter Mapbox token"
                className="flex-1"
              />
              <Button onClick={handleSetToken} type="button">
                <Search className="mr-2 h-4 w-4" />
                Set Token
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Your token will be saved in your browser for future use.
            </p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="w-full h-full" />
      )}
      
      {/* User location pulse animation */}
      <style>
        {`
        .pulse::before {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: rgba(59, 130, 246, 0.5);
          animation: pulse 2s infinite;
          z-index: -1;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        
        .doctor-popup .mapboxgl-popup-content {
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        `}
      </style>
    </div>
  );
};

export default DoctorMap;
