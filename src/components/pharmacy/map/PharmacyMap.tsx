
import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { toast } from "@/components/ui/use-toast";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Simple map updater component
function MapUpdater({ 
  coordinates,
  pharmacies,
  onPharmaciesInShape
}: { 
  coordinates: { lat: number; lon: number }; 
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
}) {
  const map = useMap();
  
  // Update map center when coordinates change
  useEffect(() => {
    if (map && coordinates) {
      map.setView([coordinates.lat, coordinates.lon], 10);
    }
  }, [map, coordinates]);
  
  // Initialize draw control
  useEffect(() => {
    if (!map) return;
    
    try {
      // Load and initialize Leaflet.Draw only if it exists
      if (L.Control && 'Draw' in L.Control) {
        // Create feature group for drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        
        // Initialize draw control
        const drawControl = new (L.Control as any).Draw({
          position: 'topright',
          draw: {
            polygon: {
              allowIntersection: false,
              shapeOptions: { color: '#3b82f6' }
            },
            rectangle: {
              shapeOptions: { color: '#3b82f6' }
            },
            circle: {
              shapeOptions: { color: '#3b82f6' }
            },
            marker: false,
            polyline: false,
            circlemarker: false
          },
          edit: {
            featureGroup: drawnItems,
            remove: true
          }
        });
        
        map.addControl(drawControl);
        
        // Check if a point is inside a shape
        const isPointInShape = (point: L.LatLng, layer: any) => {
          if (layer instanceof L.Circle) {
            return point.distanceTo(layer.getLatLng()) <= layer.getRadius();
          } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            return layer.getBounds().contains(point);
          }
          return false;
        };
        
        // Filter pharmacies based on drawn shape
        const filterByShape = (layer: any) => {
          return pharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
            return isPointInShape(pharmacyLatLng, layer);
          });
        };
        
        // Event handlers that don't rely on complex binding
        const handleDrawCreated = (e: any) => {
          drawnItems.clearLayers();
          drawnItems.addLayer(e.layer);
          
          const filteredPharmacies = filterByShape(e.layer);
          onPharmaciesInShape(filteredPharmacies);
          
          toast({
            title: "Shape drawn",
            description: `Found ${filteredPharmacies.length} pharmacies in this area`,
          });
        };
        
        // Safe event bindings
        if (map.listens) {
          map.off('draw:created');
          map.on('draw:created', handleDrawCreated);
          
          map.off('draw:deleted');
          map.on('draw:deleted', () => {
            onPharmaciesInShape(pharmacies);
            toast({
              title: "Shape deleted",
              description: `Showing all pharmacies`,
            });
          });
        }
        
        // Cleanup
        return () => {
          if (map.listens) {
            map.off('draw:created');
            map.off('draw:deleted');
          }
          
          try {
            // Try to remove the draw control safely
            if (drawControl && map.removeControl) {
              map.removeControl(drawControl);
            }
            
            // Remove drawn items layer
            if (map.removeLayer) {
              map.removeLayer(drawnItems);
            }
          } catch (e) {
            console.error('Error cleaning up map resources:', e);
          }
        };
      } else {
        console.log('Leaflet.Draw is not available');
      }
    } catch (error) {
      console.error('Error setting up draw control:', error);
    }
  }, [map, coordinates, pharmacies, onPharmaciesInShape]);
  
  return null;
}

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation 
}: PharmacyMapProps) {
  // Default center position for Luxembourg
  const defaultCenter: [number, number] = [49.8153, 6.1296];
  const centerCoords: [number, number] = coordinates?.lat && coordinates?.lon 
    ? [coordinates.lat, coordinates.lon] 
    : defaultCenter;
  
  // Add key state to force re-render when needed
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  
  useEffect(() => {
    // Force re-render of the map when coordinates change
    setMapKey(`map-${Date.now()}`);
  }, [coordinates?.lat, coordinates?.lon]);
  
  // Render pharmacy markers
  const renderPharmacyMarkers = () => {
    if (!Array.isArray(filteredPharmacies)) return null;
    
    return filteredPharmacies.map((pharmacy, index) => {
      if (!pharmacy || !pharmacy.coordinates || 
          typeof pharmacy.coordinates.lat !== 'number' || 
          typeof pharmacy.coordinates.lon !== 'number') {
        return null;
      }
      
      return (
        <Marker
          key={`pharmacy-${pharmacy.id || index}`}
          position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</p>
              <p>{pharmacy.address || 'Address not available'}</p>
              <p>{pharmacy.hours || 'Hours not available'}</p>
            </div>
          </Popup>
        </Marker>
      );
    });
  };
  
  // Render the user location marker if needed
  const renderUserLocationMarker = () => {
    if (showDefaultLocation && coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lon === 'number') {
      return (
        <Marker 
          position={[coordinates.lat, coordinates.lon]}
          key="user-location"
          icon={userLocationIcon}
        >
          <Popup>Your location</Popup>
        </Marker>
      );
    }
    return null;
  };
  
  console.log('PharmacyMap: rendering', { 
    hasCoordinates: !!coordinates,
    pharmCount: pharmacies?.length || 0,
    filteredCount: filteredPharmacies?.length || 0,
    leafletLoaded: typeof L !== 'undefined',
    reactLeafletLoaded: typeof MapContainer !== 'undefined'
  });
  
  console.log('PharmacyMap: center coordinates', centerCoords);
  
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
      <MapContainer
        key={mapKey}
        center={centerCoords}
        zoom={10}
        scrollWheelZoom={true}
        className="h-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater 
          coordinates={coordinates} 
          pharmacies={pharmacies || []}
          onPharmaciesInShape={onPharmaciesInShape}
        />
        
        {renderUserLocationMarker()}
        {renderPharmacyMarkers()}
      </MapContainer>
    </div>
  );
}
