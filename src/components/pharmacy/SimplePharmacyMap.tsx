
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin } from 'lucide-react';
import { getMapboxToken } from '@/services/mapbox';
import { toast } from '@/components/ui/use-toast';

// Mapbox requires a valid token - this is a more reliable public token for development
const MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z3UycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

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
  const [mapStyle, setMapStyle] = useState('streets-v12'); // Use v12 styles which are more reliable
  const [styleIndex, setStyleIndex] = useState(0);
  const [mapToken, setMapToken] = useState<string>(MAPBOX_PUBLIC_TOKEN);
  
  // Available map styles to cycle through
  const availableStyles = [
    'streets-v12', 
    'light-v11', 
    'dark-v11', 
    'outdoors-v12', 
    'satellite-v9',
    'satellite-streets-v12'
  ];

  // Get mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getMapboxToken();
        if (token) {
          setMapToken(token);
          console.log('Mapbox token loaded successfully');
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        // Continue with public token
      }
    };
    
    fetchToken();
  }, []);

  // Initialize the map with improved error handling and options
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Clear any previous errors
    setError(null);
    
    try {
      console.log('Initializing map with style:', mapStyle);
      
      // Set the token
      mapboxgl.accessToken = mapToken;
      
      // Map configuration with optimized settings
      const mapOptions: mapboxgl.MapOptions = {
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${mapStyle}`,
        center: userLocation ? [userLocation.lon, userLocation.lat] : [6.1296, 49.8153],
        zoom: 11,
        minZoom: 2, // Prevent zooming out too far
        maxPitch: 45, // Limit pitch to improve tile loading
        attributionControl: true, // Show attribution for Mapbox requirements
        preserveDrawingBuffer: true, // Improve stability
        antialias: true, // Better rendering
        renderWorldCopies: true // Helps with global views
      };
      
      // Create and store map instance
      const mapInstance = new mapboxgl.Map(mapOptions);
      map.current = mapInstance;

      // Add navigation controls but simplified
      mapInstance.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        visualizePitch: false
      }), 'top-right');

      // Handle map load event
      mapInstance.once('load', () => {
        console.log('Map loaded successfully with style:', mapStyle);
        setMapLoaded(true);
        setError(null);
      });
      
      // Add explicit error handling
      mapInstance.on('error', (e) => {
        console.error('Map error:', e);
        
        // Only set user-facing error for critical errors
        if (e.error && 
            !e.error.message?.includes('source has no data') &&
            !e.error.message?.includes('Tile does not exist') &&
            !e.error.message?.includes('Failed to fetch')) {
          setError('Map could not be loaded correctly. Please try a different style or refresh.');
        }
      });

      // Add style error detection
      mapInstance.on('styledata', () => {
        // Check if style loaded properly
        setTimeout(() => {
          if (mapInstance.loaded() && mapInstance.isStyleLoaded()) {
            const style = mapInstance.getStyle();
            if (!style || Object.keys(style.sources || {}).length === 0) {
              console.log('Style loaded but no sources found, retrying with a different style');
              setError('Map style could not be loaded. Please try a different style.');
            }
          }
        }, 1500); // Give style some time to fully load
      });
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Could not initialize map. Please check your network connection and try again.');
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (err) {
          console.error('Error cleaning up map:', err);
        }
        map.current = null;
      }
    };
  }, [userLocation, mapStyle, mapToken]);

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

    // Add pharmacy markers with bounds calculation
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

  // Implement a proper retry function that actually cycles through different styles
  const handleRetry = () => {
    // Clear error and reset map state
    setError(null);
    setMapLoaded(false);
    
    // Select the next style in the array
    const nextIndex = (styleIndex + 1) % availableStyles.length;
    const nextStyle = availableStyles[nextIndex];
    
    console.log(`Changing map style from ${mapStyle} to ${nextStyle}`);
    setStyleIndex(nextIndex);
    setMapStyle(nextStyle);
    
    // Remove the current map instance
    if (map.current) {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current.remove();
      map.current = null;
    }
    
    toast({
      title: "Changing map style",
      description: `Trying ${nextStyle} style`,
    });
  };

  return (
    <Card className="overflow-hidden border border-gray-200">
      <div 
        ref={mapContainer} 
        style={{ height, width: '100%', position: 'relative' }}
        className="bg-gray-100" // Add a background color in case the map fails to load
      >
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-4 text-center">
            <MapPin className="h-10 w-10 text-red-400 mb-2" />
            <h3 className="text-lg font-medium mb-2">Map Error</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try a Different Map Style
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SimplePharmacyMap;
