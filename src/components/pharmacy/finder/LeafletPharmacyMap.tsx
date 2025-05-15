
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { toast } from "@/components/ui/use-toast";
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Card } from "@/components/ui/card";

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

// Fix for incompatible handlers (for mobile devices)
if (L.Browser.touch) {
  L.Map.addInitHook("addHandler", "touchExtend", L.Map.TouchExtend);
}

// Component to update map view when coordinates change
const MapUpdater = ({ coordinates }: { coordinates: { lat: number; lon: number } }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.lat && coordinates.lon) {
      map.setView([coordinates.lat, coordinates.lon], map.getZoom());
    }
  }, [coordinates, map]);
  
  return null;
};

// Component for user's location marker with circle
const UserLocationMarker = ({ 
  coordinates,
  radius = 2000 // 2km radius
}: { 
  coordinates: { lat: number; lon: number },
  radius?: number
}) => {
  if (!coordinates || !coordinates.lat || !coordinates.lon) {
    return null;
  }
  
  const position: [number, number] = [coordinates.lat, coordinates.lon];
  
  return (
    <>
      <Marker position={position} icon={userLocationIcon}>
        <Popup>Your location</Popup>
      </Marker>
      {/* Create a circle using Leaflet's L.Circle directly after render */}
    </>
  );
};

// Custom draw control component
const DrawControl = ({ onShapesDrawn }: { onShapesDrawn: (shapes: any[]) => void }) => {
  const map = useMap();
  const drawControlRef = useRef<any>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  
  useEffect(() => {
    if (!map) return;

    try {
      // Add the FeatureGroup to the map
      map.addLayer(drawnItemsRef.current);
      
      // Initialize the draw control
      const drawControl = new (L.Control as any).Draw({
        position: 'topright',
        draw: {
          polyline: false,
          polygon: {
            allowIntersection: false,
            showArea: true,
            drawError: {
              color: '#e1e100',
              message: '<strong>Error:</strong> Polygon edges cannot cross!'
            }
          },
          circle: true,
          rectangle: true,
          marker: false,
          circlemarker: false
        },
        edit: {
          featureGroup: drawnItemsRef.current
        }
      });
      
      map.addControl(drawControl);
      drawControlRef.current = drawControl;
      
      // Event handler for when a shape is created
      const handleDrawCreated = (e: any) => {
        try {
          const layer = e.layer;
          drawnItemsRef.current.addLayer(layer);
          
          // Get all shapes in the current drawn items
          const shapes: any[] = [];
          drawnItemsRef.current.eachLayer((layer: any) => {
            shapes.push(layer);
          });
          
          // Call callback with shapes
          onShapesDrawn(shapes);
        } catch (err) {
          console.error('Error handling draw created event:', err);
        }
      };
      
      // Event handler for when shapes are edited
      const handleDrawEdited = (e: any) => {
        try {
          // Get all shapes in the current drawn items
          const shapes: any[] = [];
          drawnItemsRef.current.eachLayer((layer: any) => {
            shapes.push(layer);
          });
          
          // Call callback with shapes
          onShapesDrawn(shapes);
        } catch (err) {
          console.error('Error handling draw edited event:', err);
        }
      };
      
      // Event handler for when shapes are deleted
      const handleDrawDeleted = (e: any) => {
        try {
          // Get all shapes in the current drawn items
          const shapes: any[] = [];
          drawnItemsRef.current.eachLayer((layer: any) => {
            shapes.push(layer);
          });
          
          // Call callback with shapes
          onShapesDrawn(shapes);
        } catch (err) {
          console.error('Error handling draw deleted event:', err);
        }
      };
      
      // Add event listeners
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      map.on(L.Draw.Event.EDITED, handleDrawEdited);
      map.on(L.Draw.Event.DELETED, handleDrawDeleted);
      
      return () => {
        // Clean up event listeners
        map.off(L.Draw.Event.CREATED, handleDrawCreated);
        map.off(L.Draw.Event.EDITED, handleDrawEdited);
        map.off(L.Draw.Event.DELETED, handleDrawDeleted);
        
        // Remove control and layer
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
        }
        
        if (drawnItemsRef.current) {
          map.removeLayer(drawnItemsRef.current);
        }
      };
    } catch (err) {
      console.error('Error setting up draw control:', err);
      toast({
        title: "Map Error",
        description: "There was a problem initializing the map drawing tools.",
        variant: "destructive"
      });
    }
  }, [map, onShapesDrawn]);
  
  return null;
};

interface LeafletPharmacyMapProps {
  pharmacies: any[];
  userLocation: { lat: number; lon: number } | null;
  useLocationFilter: boolean;
  onPharmaciesInShape: (pharmacies: any[]) => void;
}

const LeafletPharmacyMap: React.FC<LeafletPharmacyMapProps> = ({
  pharmacies,
  userLocation,
  useLocationFilter,
  onPharmaciesInShape
}) => {
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const mapRef = useRef(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  
  // Default coordinates for Luxembourg
  const defaultCoordinates = { lat: 49.8153, lon: 6.1296 };
  const coordinates = userLocation || defaultCoordinates;
  
  // Force map re-render when coordinates change
  useEffect(() => {
    setMapKey(`map-${Date.now()}`);
  }, [coordinates.lat, coordinates.lon]);
  
  // Handle shapes drawn on the map
  const handleShapesDrawn = (shapes: any[]) => {
    try {
      if (!shapes || shapes.length === 0) {
        // No shapes drawn, return all pharmacies
        onPharmaciesInShape(pharmacies);
        return;
      }
      
      // Filter pharmacies based on shapes
      const filteredPharmacies = pharmacies.filter(pharmacy => {
        if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
        
        const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
        
        // Check if pharmacy is inside any of the drawn shapes
        return shapes.some(shape => {
          try {
            if (shape instanceof L.Circle) {
              const center = shape.getLatLng();
              const radius = shape.getRadius();
              return center.distanceTo(pharmacyLatLng) <= radius;
            }
            
            if (shape instanceof L.Rectangle || shape instanceof L.Polygon) {
              return shape.getBounds().contains(pharmacyLatLng);
            }
            
            return false;
          } catch (err) {
            console.error('Error checking if pharmacy is in shape:', err);
            return false;
          }
        });
      });
      
      onPharmaciesInShape(filteredPharmacies);
      toast({
        title: `${filteredPharmacies.length} pharmacies found`,
        description: `Found ${filteredPharmacies.length} pharmacies in the selected area.`,
      });
    } catch (err) {
      console.error('Error handling shapes drawn:', err);
    }
  };

  // Effect to add the user location circle after the map is loaded
  useEffect(() => {
    if (!userLocation || !useLocationFilter) return;

    const addUserCircle = () => {
      const map = document.querySelector('.leaflet-container')?._leaflet_map;
      if (map && userLocation) {
        // Remove existing circle if any
        if (userCircleRef.current) {
          map.removeLayer(userCircleRef.current);
        }
        
        // Create new circle
        const circle = L.circle(
          [userLocation.lat, userLocation.lon],
          {
            radius: 2000, // 2km radius
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.05,
            weight: 0.5
          }
        ).addTo(map);
        
        userCircleRef.current = circle;
      }
    };

    // Small delay to ensure map is rendered
    setTimeout(addUserCircle, 500);

    return () => {
      if (userCircleRef.current) {
        const map = document.querySelector('.leaflet-container')?._leaflet_map;
        if (map) {
          map.removeLayer(userCircleRef.current);
        }
        userCircleRef.current = null;
      }
    };
  }, [userLocation, useLocationFilter, mapKey]);
  
  return (
    <Card className="overflow-hidden border border-gray-200 h-[500px]">
      <MapContainer
        key={mapKey}
        center={[coordinates.lat, coordinates.lon]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Update map when coordinates change */}
        <MapUpdater coordinates={coordinates} />
        
        {/* Add draw control */}
        <DrawControl onShapesDrawn={handleShapesDrawn} />
        
        {/* Show user location marker */}
        {useLocationFilter && userLocation && (
          <UserLocationMarker coordinates={userLocation} />
        )}
        
        {/* Render pharmacy markers */}
        {pharmacies.map((pharmacy) => {
          if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return null;
          
          return (
            <Marker
              key={`pharmacy-${pharmacy.id}`}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</p>
                  <p>{pharmacy.address || 'Address not available'}</p>
                  {pharmacy.hours && <p>{pharmacy.hours}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Card>
  );
};

export default LeafletPharmacyMap;
