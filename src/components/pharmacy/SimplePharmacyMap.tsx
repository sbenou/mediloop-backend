
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin } from 'lucide-react';

// Default mapbox public token - using a reliable token for development
// Note: In production, this should be replaced with an environment variable
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
  email?: string;
  phone?: string;
  hours?: string;
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
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize the map once when the component mounts
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    try {
      // Configure Mapbox with the token
      mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;
      
      // Create the map instance with basic options
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Using streets-v11 for more consistent loading
        center: userLocation ? [userLocation.lon, userLocation.lat] : [6.1296, 49.8153], // Default: Luxembourg
        zoom: 11,
        attributionControl: false,
        maxPitch: 0, // Disable pitch to prevent rendering issues
        renderWorldCopies: true, // Improve world-view rendering
        preserveDrawingBuffer: true, // Help with rendering on some browsers
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false
      }), 'top-right');

      // Disable rotation to prevent WebGL errors
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();

      // Handle map load event
      map.current.once('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('Map error:', e);
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
        try {
          if (map.current.off) {
            map.current.off('load', null);
            map.current.off('error', null);
          }
          map.current.remove();
          map.current = null;
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
      }
    };
  }, [userLocation]);

  // Add markers when the map is loaded or when pharmacies/userLocation change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Clear any existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    console.log('Adding markers for', pharmacies.length, 'pharmacies');
    
    // Add user location marker if available
    if (userLocation) {
      try {
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
      } catch (error) {
        console.error('Error adding user location marker:', error);
      }
    }

    // Add pharmacy markers
    const bounds = new mapboxgl.LngLatBounds();
    let validCoordinates = false;

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

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
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

        // Add hover events to show/hide the popup
        el.addEventListener('mouseenter', () => {
          marker.getPopup().addTo(map.current!);
        });
        
        el.addEventListener('mouseleave', () => {
          marker.getPopup().remove();
        });

        markers.current.push(marker);
        
        // Extend bounds with this marker
        bounds.extend([lon, lat]);
        validCoordinates = true;
      } catch (error) {
        console.error('Error adding pharmacy marker:', error);
      }
    });

    // If user location is available, include it in bounds
    if (userLocation) {
      bounds.extend([userLocation.lon, userLocation.lat]);
      validCoordinates = true;
    }
    
    // Adjust map view to fit bounds if we have any valid coordinates
    if (validCoordinates && !bounds.isEmpty() && map.current) {
      console.log('Fitting map to bounds');
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [pharmacies, userLocation, mapLoaded]);

  // Handle retry button click
  const handleRetry = () => {
    setError(null);
    setMapLoaded(false);
    
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Re-initialize map
    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Using streets-v11 instead of light-v11
        center: userLocation ? [userLocation.lon, userLocation.lat] : [6.1296, 49.8153],
        zoom: 11,
        attributionControl: false,
        maxPitch: 0,
        preserveDrawingBuffer: true
      });
      
      map.current.addControl(new mapboxgl.NavigationControl({
        showCompass: false
      }), 'top-right');

      // Disable rotation
      map.current.dragRotate.disable();
      map.current.touchZoomRotate.disableRotation();
      
      map.current.on('load', () => {
        console.log('Map reloaded after retry');
        setMapLoaded(true);
      });
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
