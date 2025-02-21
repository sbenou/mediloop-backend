import { Card } from "@/components/ui/card";
import PharmacyCard from "@/components/PharmacyCard";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from "react";
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ensure measurement types are initialized
if (typeof window !== 'undefined') {
  (window as any).type = true;
}

// Initialize Leaflet.draw localization and measurement formatting
L.drawLocal.draw.handlers.circle.tooltip.start = 'Click and drag to draw circle';
L.drawLocal.draw.handlers.circle.radius = 'Radius';
L.drawLocal.draw.handlers.polygon.tooltip.start = 'Click to start drawing area';
L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Click to continue drawing shape';
L.drawLocal.draw.handlers.polygon.tooltip.end = 'Click first point to close this shape';
L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Click and drag to draw rectangle';

(L as any).drawLocal.draw.toolbar.buttons.polygon = 'Draw a polygon';
(L as any).drawLocal.draw.toolbar.buttons.rectangle = 'Draw a rectangle';
(L as any).drawLocal.draw.toolbar.buttons.circle = 'Draw a circle';

interface MapUpdaterProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

function MapUpdater({ coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    // Center map on Luxembourg if not showing default location
    const defaultView = showDefaultLocation 
      ? [coordinates.lat, coordinates.lon]
      : [49.8153, 6.1296]; // Luxembourg center coordinates
    
    const zoomLevel = showDefaultLocation ? 13 : 10;
    map.setView(defaultView as L.LatLngExpression, zoomLevel);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawOptions = {
      position: 'topright',
      draw: {
        circle: {
          shapeOptions: {
            color: '#97009c'
          },
          showRadius: true,
          metric: true,
          feet: false
        },
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Oh snap!</strong> you can\'t draw that!'
          },
          shapeOptions: {
            color: '#97009c'
          },
          showArea: true,
          metric: true
        },
        rectangle: {
          shapeOptions: {
            color: '#97009c'
          },
          showArea: true,
          metric: true
        },
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems,
        remove: true
      }
    };

    // Update initial pharmacy list based on location mode
    if (showDefaultLocation) {
      // Filter pharmacies within 2km radius of user location
      const userLocation = L.latLng(coordinates.lat, coordinates.lon);
      const nearbyPharmacies = pharmacies.filter(pharmacy => {
        const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
        return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km in meters
      });
      onPharmaciesInShape(nearbyPharmacies);
    } else {
      // Show all pharmacies when not using default location
      onPharmaciesInShape(pharmacies);
    }

    const drawControl = new (L.Control as any).Draw(drawOptions);
    map.addControl(drawControl);

    // Clear previous layers when drawing starts
    map.on(L.Draw.Event.DRAWSTART, () => {
      drawnItems.clearLayers();
    });

    // Find pharmacies within the drawn shape
    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      
      const pharmaciesInShape = pharmacies.filter(pharmacy => {
        const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
        
        if (layer instanceof L.Circle) {
          return layer.getBounds().contains(pharmacyLatLng);
        } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
          return layer.getBounds().contains(pharmacyLatLng);
        }
        return false;
      });

      onPharmaciesInShape(pharmaciesInShape);
    });

    // Reset to location-based filtering when shape is deleted
    map.on(L.Draw.Event.DELETED, () => {
      if (showDefaultLocation) {
        const userLocation = L.latLng(coordinates.lat, coordinates.lon);
        const nearbyPharmacies = pharmacies.filter(pharmacy => {
          const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
          return userLocation.distanceTo(pharmacyLocation) <= 2000;
        });
        onPharmaciesInShape(nearbyPharmacies);
      } else {
        onPharmaciesInShape(pharmacies);
      }
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [coordinates, map, pharmacies, onPharmaciesInShape, showDefaultLocation]);
  
  return null;
}

interface PharmacyListSectionProps {
  pharmacies: any[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number } | null;
  defaultPharmacyId: string | null;
  onPharmacySelect: (pharmacyId: string) => void;
  onSetDefaultPharmacy: (pharmacyId: string, isDefault: boolean) => void;
}

const PharmacyListSection = ({
  pharmacies,
  isLoading,
  coordinates,
  defaultPharmacyId,
  onPharmacySelect,
  onSetDefaultPharmacy
}: PharmacyListSectionProps) => {
  const [filteredPharmacies, setFilteredPharmacies] = useState(pharmacies);
  const [showDefaultLocation, setShowDefaultLocation] = useState(true);

  // Update filtered pharmacies when showDefaultLocation changes
  useEffect(() => {
    if (!coordinates) return;

    if (showDefaultLocation) {
      const userLocation = L.latLng(coordinates.lat, coordinates.lon);
      const nearbyPharmacies = pharmacies.filter(pharmacy => {
        const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
        return userLocation.distanceTo(pharmacyLocation) <= 2000;
      });
      setFilteredPharmacies(nearbyPharmacies);
    } else {
      setFilteredPharmacies(pharmacies);
    }
  }, [showDefaultLocation, coordinates, pharmacies]);

  if (!coordinates) {
    return <div>Loading location...</div>;
  }

  const center: L.LatLngExpression = [coordinates.lat, coordinates.lon];

  return (
    <div className="mt-24 grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
      <div className="overflow-y-auto space-y-4 pr-4 relative z-50">
        <div className="flex items-center space-x-2 p-4 bg-white rounded-lg shadow">
          <Switch
            id="show-location"
            checked={showDefaultLocation}
            onCheckedChange={setShowDefaultLocation}
          />
          <Label htmlFor="show-location">Show my location</Label>
        </div>

        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </>
        )}

        {filteredPharmacies.map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            {...pharmacy}
            onSelect={onPharmacySelect}
            onSetDefault={onSetDefaultPharmacy}
            isDefault={defaultPharmacyId === pharmacy.id}
          />
        ))}

        {filteredPharmacies.length === 0 && coordinates && !isLoading && (
          <p className="text-center text-gray-500">No pharmacies found in this area</p>
        )}
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
        <MapContainer
          className="h-full"
          style={{ height: '100%', width: '100%' }}
          whenReady={() => {}}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater 
            coordinates={coordinates} 
            pharmacies={pharmacies}
            onPharmaciesInShape={setFilteredPharmacies}
            showDefaultLocation={showDefaultLocation}
          />
          
          {/* User location marker */}
          {showDefaultLocation && (
            <Marker position={center}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          {/* Pharmacy markers */}
          {pharmacies.map((pharmacy) => (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon] as L.LatLngExpression}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{pharmacy.name}</p>
                  <p>{pharmacy.address}</p>
                  <p>{pharmacy.hours}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default PharmacyListSection;
