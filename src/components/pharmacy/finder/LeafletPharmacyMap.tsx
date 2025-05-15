
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import { toast } from '@/components/ui/use-toast';
import type { Pharmacy } from '@/lib/types/overpass.types';

// Fix for Leaflet icons in production
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Set up default Leaflet icons
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Interface for the component props
interface LeafletPharmacyMapProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
  onPharmaciesInShape?: (pharmacies: Pharmacy[]) => void;
}

// Component to handle drawing on the map
const DrawingControl = ({ onPharmaciesInShape, pharmacies }: { 
  onPharmaciesInShape?: (pharmacies: Pharmacy[]) => void;
  pharmacies: Pharmacy[];
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    // Initialize the draw control
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Use type assertion to avoid TypeScript errors with Leaflet.draw
    // @ts-ignore - Leaflet.draw types are not complete
    const drawControl = new L.Control.Draw({
      draw: {
        marker: false,
        polyline: false,
        circlemarker: false,
        polygon: {
          allowIntersection: false,
          showArea: true
        },
        rectangle: true,
        circle: true,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    });
    
    map.addControl(drawControl);
    
    // Handle completed draw events
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      
      // Filter pharmacies based on the drawn shape
      if (onPharmaciesInShape) {
        const filteredPharmacies = pharmacies.filter(pharmacy => {
          if (!pharmacy.coordinates) return false;
          
          const pharmacyLatLng = L.latLng(
            pharmacy.coordinates.lat, 
            pharmacy.coordinates.lon
          );
          
          let isInside = false;
          
          if (e.layerType === 'circle') {
            const center = layer.getLatLng();
            const radius = layer.getRadius();
            isInside = center.distanceTo(pharmacyLatLng) <= radius;
          } else if (e.layerType === 'rectangle' || e.layerType === 'polygon') {
            isInside = layer.contains(pharmacyLatLng);
          }
          
          return isInside;
        });
        
        onPharmaciesInShape(filteredPharmacies);
        
        // Show toast with count of pharmacies in the shape
        toast({
          title: `${filteredPharmacies.length} pharmacies found`,
          description: `Found ${filteredPharmacies.length} pharmacies within the selected area.`
        });
      }
    });
    
    // Handle deleted draw items
    map.on(L.Draw.Event.DELETED, (e: any) => {
      if (onPharmaciesInShape) {
        // Reset to all pharmacies when shapes are deleted
        onPharmaciesInShape(pharmacies);
      }
    });
    
    return () => {
      map.removeLayer(drawnItems);
      // @ts-ignore - Leaflet typings don't include remove method on Control.Draw
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map, onPharmaciesInShape, pharmacies]);
  
  return null;
};

// Initialize the map and provide zoom to fit bounds
const MapUpdater = ({ pharmacies, userLocation }: { 
  pharmacies: Pharmacy[]; 
  userLocation: { lat: number; lon: number } | null;
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    if (pharmacies.length === 0) return;
    
    try {
      // Create bounds for all pharmacy locations
      const bounds = L.latLngBounds([]);
      
      // Add pharmacy locations to bounds
      pharmacies.forEach(pharmacy => {
        if (pharmacy.coordinates) {
          bounds.extend([pharmacy.coordinates.lat, pharmacy.coordinates.lon]);
        }
      });
      
      // Add user location to bounds if available
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lon]);
      }
      
      // Only fit bounds if we have valid bounds to fit
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15
        });
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
    }
  }, [map, pharmacies, userLocation]);
  
  return null;
};

// User location component with circle
const UserLocationMarker = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Add a circle around the user's location
    const circle = L.circle(position, {
      radius: 2000, // 2km radius
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.1
    }).addTo(map);
    
    return () => {
      map.removeLayer(circle);
    };
  }, [map, position]);
  
  return (
    <Marker position={position}>
      <Popup>Your location</Popup>
    </Marker>
  );
};

// Pharmacy marker with custom color
const PharmacyMarker = ({ pharmacy }: { pharmacy: Pharmacy }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!pharmacy.coordinates) return null;
  
  return (
    <Marker 
      position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
      eventHandlers={{
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold">{pharmacy.name}</h3>
          <p className="text-sm">{pharmacy.address}</p>
          {pharmacy.hours && <p className="text-sm">{pharmacy.hours}</p>}
          {pharmacy.phone && <p className="text-sm">{pharmacy.phone}</p>}
          {pharmacy.distance && <p className="text-sm badge">{pharmacy.distance}km away</p>}
        </div>
      </Popup>
    </Marker>
  );
};

export const LeafletPharmacyMap: React.FC<LeafletPharmacyMapProps> = ({
  pharmacies,
  userLocation,
  useLocationFilter,
  onPharmaciesInShape
}) => {
  // Default center if no user location (Luxembourg)
  const defaultCenter = { lat: 49.8153, lon: 6.1296 };
  const center = userLocation || defaultCenter;
  
  // If no pharmacies, show a message
  if (pharmacies.length === 0) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-muted/20 border rounded-lg">
        <p className="text-muted-foreground">No pharmacies found to display on the map.</p>
      </div>
    );
  }
  
  return (
    <div className="h-[600px] border rounded-lg overflow-hidden relative">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker and circle */}
        {userLocation && useLocationFilter && (
          <UserLocationMarker position={[userLocation.lat, userLocation.lon]} />
        )}
        
        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy) => (
          <PharmacyMarker key={pharmacy.id} pharmacy={pharmacy} />
        ))}
        
        {/* Map updater to fit markers */}
        <MapUpdater pharmacies={pharmacies} userLocation={userLocation} />
        
        {/* Drawing tools */}
        <DrawingControl 
          onPharmaciesInShape={onPharmaciesInShape} 
          pharmacies={pharmacies} 
        />
      </MapContainer>
      
      <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow z-[1000]">
        <p className="text-xs text-muted-foreground">
          Draw shapes to filter pharmacies (click the rectangle or polygon icon on the left)
        </p>
      </div>
    </div>
  );
};

export default LeafletPharmacyMap;
