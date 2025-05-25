
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token - fallback to a default if not configured
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Only set the token if it's not the default one
if (MAPBOX_TOKEN && !MAPBOX_TOKEN.includes('mapbox')) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
} else {
  // Use a simple fallback or disable map features
  console.warn('Mapbox token not configured properly. Map functionality may be limited.');
}

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  coordinates?: { lat: number; lon: number } | null;
  source?: 'database' | 'overpass';
}

interface DoctorMapProps {
  doctors: Doctor[];
  userCoordinates: { lat: number; lon: number } | null;
  showUserLocation?: boolean;
  onDoctorSelect?: (doctorId: string) => void;
}

const DoctorMap: React.FC<DoctorMapProps> = ({
  doctors,
  userCoordinates,
  showUserLocation = false,
  onDoctorSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if we have a valid token
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN.includes('mapbox')) {
      // Show a fallback message instead of map
      if (mapContainer.current) {
        mapContainer.current.innerHTML = `
          <div class="flex items-center justify-center h-full bg-gray-100 text-gray-600">
            <div class="text-center">
              <p class="text-lg font-medium">Map Unavailable</p>
              <p class="text-sm">Mapbox access token not configured</p>
            </div>
          </div>
        `;
      }
      return;
    }

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: userCoordinates ? [userCoordinates.lon, userCoordinates.lat] : [6.1296, 49.8153],
      zoom: 12
    });

    // Add user location marker if enabled
    if (showUserLocation && userCoordinates) {
      new mapboxgl.Marker({ color: 'blue' })
        .setLngLat([userCoordinates.lon, userCoordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Your Location</h3>'))
        .addTo(map.current);
    }

    // Add doctor markers
    doctors.forEach(doctor => {
      if (doctor.coordinates) {
        const marker = new mapboxgl.Marker({ color: doctor.source === 'database' ? 'red' : 'orange' })
          .setLngLat([doctor.coordinates.lon, doctor.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div>
                <h3>${doctor.full_name}</h3>
                <p>${doctor.city || 'Location not specified'}</p>
                <p>License: ${doctor.license_number}</p>
                ${doctor.source === 'database' ? '<button onclick="selectDoctor(\'' + doctor.id + '\')">Connect</button>' : '<p>Directory listing only</p>'}
              </div>
            `)
          )
          .addTo(map.current);

        // Add click handler for doctor selection
        marker.getElement().addEventListener('click', () => {
          if (onDoctorSelect && doctor.source === 'database') {
            onDoctorSelect(doctor.id);
          }
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [doctors, userCoordinates, showUserLocation, onDoctorSelect]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default DoctorMap;
