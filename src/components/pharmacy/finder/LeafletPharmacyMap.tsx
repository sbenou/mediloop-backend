
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
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  
  useEffect(() => {
    if (!map) return;

    try {
      // Initialize the draw control
      const drawnItems = new L.FeatureGroup();
      drawnItemsRef.current = drawnItems;
      map.addLayer(drawnItems);
      
      // Ensure Leaflet.Draw is available
      if (typeof L.Control.Draw === 'undefined') {
        console.error('Leaflet.Draw is not defined');
        return;
      }
      
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
      
      drawControlRef.current = drawControl;
      map.addControl(drawControl);
      
      const handleDrawCreated = (e: any) => {
        const layer = e.layer;
        if (drawnItemsRef.current) {
          drawnItemsRef.current.addLayer(layer);
          
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
        }
      };
      
      const handleDeleted = () => {
        if (onPharmaciesInShape) {
          // Reset to all pharmacies when shapes are deleted
          onPharmaciesInShape(pharmacies);
        }
      };
      
      // Use standard DOM event listeners to avoid React synthetic event issues
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      map.on(L.Draw.Event.DELETED, handleDeleted);
      
      return () => {
        // Properly clean up all event listeners and controls
        map.off(L.Draw.Event.CREATED, handleDrawCreated);
        map.off(L.Draw.Event.DELETED, handleDeleted);
        
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
        }
        
        if (drawnItemsRef.current) {
          map.removeLayer(drawnItemsRef.current);
        }
      };
    } catch (error) {
      console.error('Error setting up drawing control:', error);
      return () => {};
    }
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
  const circleRef = useRef<L.Circle | null>(null);
  
  useEffect(() => {
    // Add a circle around the user's location
    const circle = L.circle(position, {
      radius: 2000, // 2km radius
      color: 'blue',
      fillColor: 'blue',
      fillOpacity: 0.1
    }).addTo(map);
    
    circleRef.current = circle;
    
    return () => {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }
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
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  
  // Setup global error handling for Leaflet
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Filter out common Leaflet errors
      if (event.message && (
        event.message.includes('a is not a function') ||
        event.message.includes('touchleave') ||
        event.message.includes('canvas is null')
      )) {
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    window.addEventListener('error', handleError);
    
    return () => window.removeEventListener('error', handleError);
  }, []);
  
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
        whenCreated={(map) => {
          mapRef.current = map;
          // Disable problematic touch handlers in Leaflet
          map.options.tap = false;
          map.options.touchZoom = false;
          // Set flag that map is ready
          setMapReady(true);
        }}
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
        {mapReady && (
          <DrawingControl 
            onPharmaciesInShape={onPharmaciesInShape} 
            pharmacies={pharmacies} 
          />
        )}
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
