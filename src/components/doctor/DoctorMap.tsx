
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { calculateDistance } from '@/lib/utils/distance';

interface Doctor {
  id: string;
  full_name: string;
  coordinates?: { lat: number; lon: number } | null;
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

  // Initialize and render map
  useEffect(() => {
    // Check for mapbox token - without it, we can't show the map
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    
    if (!mapboxgl.accessToken) {
      console.error('Mapbox token is missing. Map cannot be displayed.');
      return;
    }

    if (!mapContainer.current) return;

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
  }, [userCoordinates]);

  // Add doctor markers to map
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Don't try to add markers until the map has loaded
    if (!map.current.loaded()) {
      map.current.on('load', addDoctorMarkers);
      return;
    }

    addDoctorMarkers();

    function addDoctorMarkers() {
      if (!map.current) return;
      
      // Add markers for doctors with coordinates
      doctors.forEach(doctor => {
        if (doctor.coordinates?.lat && doctor.coordinates?.lon) {
          const doctorLat = parseFloat(String(doctor.coordinates.lat));
          const doctorLon = parseFloat(String(doctor.coordinates.lon));
          
          if (isNaN(doctorLat) || isNaN(doctorLon)) return;
          
          // Calculate distance if user location is available
          let distanceStr = '';
          if (userCoordinates?.lat && userCoordinates?.lon) {
            const distance = calculateDistance(
              userCoordinates.lat,
              userCoordinates.lon,
              doctorLat,
              doctorLon
            );
            
            if (typeof distance === 'number') {
              distanceStr = `(${distance.toFixed(1)} km)`;
            } else {
              distanceStr = `(${distance})`;
            }
          }
          
          // Create marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'cursor-pointer';
          markerElement.innerHTML = `
            <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white relative group">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          `;

          // Create popup
          const popup = new mapboxgl.Popup({ 
            offset: 25,
            closeButton: false
          }).setHTML(`
            <div class="p-2">
              <h3 class="text-sm font-medium">${doctor.full_name}</h3>
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
            onDoctorSelect(doctor.id);
          });
          
          // Store marker for later cleanup
          markers.current.push(marker);
        }
      });
    }
    
    // Fit map to markers
    if (markers.current.length > 0 && !userCoordinates) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      map.current.fitBounds(bounds, { padding: 70, maxZoom: 13 });
    }
  }, [doctors, userCoordinates, onDoctorSelect]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="w-full h-full" />
      
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
        `}
      </style>
    </div>
  );
};

export default DoctorMap;
