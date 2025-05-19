
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin } from 'lucide-react';

// Default mapbox public token - fallback if service fails
const DEFAULT_MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number | string;
    lon: number | string;
  };
  distance?: string;
}

interface SimplePharmacyMapProps {
  pharmacies: Pharmacy[];
  userLocation?: { lat: number; lon: number } | null;
  height?: string | number;
}

const SimplePharmacyMap: React.FC<SimplePharmacyMapProps> = ({
  pharmacies,
  userLocation,
  height = '500px'
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize the map once when the component mounts
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Use default token for simplicity
    mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;

    try {
      // Create the map instance with basic options
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: userLocation ? [userLocation.lon, userLocation.lat] : [6.1296, 49.8153], // Default: Luxembourg
        zoom: 11,
        attributionControl: false
      });

      // Add simple navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false
      }), 'top-right');

      // Handle successful map load
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        addMarkers();
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        // Only set user-facing errors for critical failures
        if (e.error && !e.error.message?.includes('source has no data')) {
          setError('Map could not be loaded correctly');
        }
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Could not initialize map');
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers for pharmacies and user location
  const addMarkers = () => {
    if (!map.current) return;

    // Clear any existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add user location marker if available
    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lon, userLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Your location'))
        .addTo(map.current);

      markers.current.push(marker);
    }

    // Add pharmacy markers
    pharmacies.forEach(pharmacy => {
      if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return;
      
      try {
        const lat = parseFloat(String(pharmacy.coordinates.lat));
        const lon = parseFloat(String(pharmacy.coordinates.lon));
        
        if (isNaN(lat) || isNaN(lon)) return;

        const el = document.createElement('div');
        el.className = 'pharmacy-marker';
        el.style.width = '25px';
        el.style.height = '25px';
        el.style.backgroundColor = '#10b981';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        el.style.cursor = 'pointer';

        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <h3 class="font-semibold">${pharmacy.name || 'Pharmacy'}</h3>
              <p class="text-xs text-gray-600">${pharmacy.address || 'No address'}</p>
              ${pharmacy.distance ? `<p class="text-xs font-medium mt-1">Distance: ${pharmacy.distance} km</p>` : ''}
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lon, lat])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      } catch (error) {
        console.error('Error adding pharmacy marker:', error);
      }
    });

    // Adjust the map view to fit all markers if we have pharmacies
    if (pharmacies.length > 0 && map.current) {
      // Find bounds that include all markers
      const bounds = new mapboxgl.LngLatBounds();
      
      pharmacies.forEach(pharmacy => {
        if (pharmacy.coordinates?.lat && pharmacy.coordinates?.lon) {
          const lat = parseFloat(String(pharmacy.coordinates.lat));
          const lon = parseFloat(String(pharmacy.coordinates.lon));
          
          if (!isNaN(lat) && !isNaN(lon)) {
            bounds.extend([lon, lat]);
          }
        }
      });
      
      // Add user location to bounds if available
      if (userLocation) {
        bounds.extend([userLocation.lon, userLocation.lat]);
      }
      
      // Only fit bounds if we have valid coordinates
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  };

  // Update markers when pharmacies or user location change
  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addMarkers();
    }
  }, [pharmacies, userLocation]);

  // Handle retry button click
  const handleRetry = () => {
    setError(null);
    
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Re-initialize map
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: userLocation ? [userLocation.lon, userLocation.lat] : [6.1296, 49.8153],
        zoom: 11,
        attributionControl: false
      });
      
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false
      }), 'top-right');
      
      map.current.on('load', () => addMarkers());
    }
  };

  return (
    <Card className="overflow-hidden border border-gray-200">
      <div 
        ref={mapContainer} 
        style={{ height, width: '100%', position: 'relative' }}
      >
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-4 text-center">
            <MapPin className="h-10 w-10 text-red-400 mb-2" />
            <h3 className="text-lg font-medium mb-2">Map Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading Map
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SimplePharmacyMap;
