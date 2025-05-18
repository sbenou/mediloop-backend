
import { useEffect, useState, useMemo, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Map as MapIcon } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocalCache } from '@/lib/cache';
import { getMapboxToken } from '@/services/mapbox';
import { MapboxMapUpdater } from './MapboxMapUpdater';

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

// Create a pharmacy marker element
const createPharmacyMarker = () => {
  const el = document.createElement('div');
  el.className = 'pharmacy-marker';
  el.style.width = '25px';
  el.style.height = '41px';
  el.style.backgroundImage = "url(https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png)";
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  return el;
};

// Create a map fallback component
const StaticMapFallback: React.FC<PharmacyMapProps> = ({
  coordinates,
  pharmacies,
  filteredPharmacies,
  onPharmaciesInShape,
  showDefaultLocation
}) => {
  console.log('Rendering StaticMapFallback with', filteredPharmacies.length, 'pharmacies');
  
  const mapUrl = useMemo(() => {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${coordinates.lon},${coordinates.lat},12,0/600x400?access_token=pk.eyJ1Ijoic2Jlbm91IiwiYSI6ImNtODNzbWIyZzBwenQyaXM3MG53b2w0a2sifQ.HJnB_hJ0GtKEudKAGO3GtA`;
  }, [coordinates]);
  
  useEffect(() => {
    if (filteredPharmacies.length > 0) {
      console.log('Static map: passing filtered pharmacies to parent');
      onPharmaciesInShape(filteredPharmacies);
    }
  }, [filteredPharmacies, onPharmaciesInShape]);
  
  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center p-6 bg-white/80 rounded-lg max-w-xs">
          <MapIcon className="h-10 w-10 text-primary/60 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-3">
            Using static map view to prevent compatibility issues.
          </p>
          <p className="text-xs text-muted-foreground">
            {filteredPharmacies.length} pharmacies found 
            {showDefaultLocation ? ' near your location' : ''}
          </p>
        </div>
      </div>
      
      <img 
        src={mapUrl}
        alt="Static pharmacy map" 
        className="w-full h-full object-cover"
        loading="eager"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
        }}
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-center text-xs">
        <p>Static map view (interactive maps disabled to prevent errors)</p>
      </div>
    </div>
  );
};

export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation 
}: PharmacyMapProps) {
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapError, setIsMapError] = useState(false);
  
  // Get Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Try to get from cache first
        const cachedToken = LocalCache.get<string>('mapbox_token');
        if (cachedToken) {
          console.log('Using cached Mapbox token');
          setMapboxToken(cachedToken);
          return;
        }
        
        // Fetch fresh token
        const token = await getMapboxToken();
        console.log('Fetched Mapbox token');
        setMapboxToken(token);
        
        // Cache the token
        if (token) {
          LocalCache.set('mapbox_token', token);
        }
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setIsMapError(true);
      }
    };
    
    fetchToken();
  }, []);
  
  // Initialize map when container and token are available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapInstance.current) {
      return;
    }
    
    console.log('Initializing Mapbox map');
    
    try {
      // Set access token
      mapboxgl.accessToken = mapboxToken;
      
      // Create map instance
      mapInstance.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [coordinates.lon, coordinates.lat],
        zoom: 12
      });
      
      // Add navigation control
      mapInstance.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Handle map load
      mapInstance.current.on('load', () => {
        console.log('Mapbox map loaded');
        setIsMapLoaded(true);
      });
      
      // Handle map error
      mapInstance.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setIsMapError(true);
      });
    } catch (err) {
      console.error('Error creating Mapbox map:', err);
      setIsMapError(true);
    }
    
    // Cleanup
    return () => {
      if (mapInstance.current) {
        console.log('Removing Mapbox map');
        markers.current.forEach(marker => marker.remove());
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapboxToken, coordinates.lat, coordinates.lon]);
  
  // Handle map ready
  const handleMapReady = (map: mapboxgl.Map | undefined) => {
    if (!map) return;
    console.log('Map is ready, updating markers');
    updateMarkers();
  };
  
  // Update markers when filtered pharmacies change
  const updateMarkers = () => {
    if (!mapInstance.current || !isMapLoaded) {
      console.log('Cannot update markers, map not ready');
      return;
    }
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    // Create new markers
    console.log(`Adding ${filteredPharmacies.length} pharmacy markers`);
    
    filteredPharmacies.forEach(pharmacy => {
      if (!pharmacy.coordinates || !pharmacy.coordinates.lat || !pharmacy.coordinates.lon) {
        console.log('Pharmacy missing coordinates:', pharmacy.name);
        return;
      }
      
      // Create marker element
      const el = createPharmacyMarker();
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'pharmacy-popup';
      popupContent.innerHTML = `
        <h3 style="font-weight: bold; margin-bottom: 4px;">${pharmacy.name || 'Pharmacy'}</h3>
        <p style="font-size: 0.9rem;">${pharmacy.address || 'Address unavailable'}</p>
        ${pharmacy.hours ? `<p style="font-size: 0.8rem; color: #666; margin-top: 4px;">${pharmacy.hours}</p>` : ''}
      `;
      
      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setDOMContent(popupContent);
      
      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([pharmacy.coordinates.lon, pharmacy.coordinates.lat])
        .setPopup(popup)
        .addTo(mapInstance.current!);
      
      // Add to markers array
      markers.current.push(marker);
    });
    
    // Notify parent of pharmacies
    onPharmaciesInShape(filteredPharmacies);
  };
  
  // Update markers when filtered pharmacies change
  useEffect(() => {
    if (isMapLoaded && mapInstance.current) {
      updateMarkers();
    }
  }, [filteredPharmacies, isMapLoaded]);
  
  // Show error toast when map fails
  useEffect(() => {
    if (isMapError) {
      toast({
        title: "Map Error",
        description: "There was a problem loading the map. Using fallback.",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [isMapError]);
  
  // Render fallback if map loading fails
  if (isMapError) {
    return (
      <StaticMapFallback
        coordinates={coordinates}
        pharmacies={pharmacies}
        filteredPharmacies={filteredPharmacies}
        onPharmaciesInShape={onPharmaciesInShape}
        showDefaultLocation={showDefaultLocation}
      />
    );
  }
  
  return (
    <div className="w-full h-full relative z-10">
      <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
        <div ref={mapContainer} className="h-full w-full">
          {/* Map container */}
        </div>
        
        {/* Map updater to handle coordinates changes */}
        {isMapLoaded && (
          <MapboxMapUpdater 
            mapRef={mapInstance}
            coordinates={coordinates}
            onMapReady={handleMapReady}
          />
        )}
      </div>
    </div>
  );
}
