
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from "@/components/ui/use-toast";

interface MapUpdaterProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function MapUpdater({ coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    // Center map on Luxembourg if not showing default location
    const defaultView = showDefaultLocation && coordinates.lat && coordinates.lon
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

    // Function to filter pharmacies based on user location
    const filterByLocation = () => {
      if (showDefaultLocation && coordinates.lat && coordinates.lon) {
        const userLocation = L.latLng(coordinates.lat, coordinates.lon);
        return pharmacies.filter(pharmacy => {
          if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
          const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
          return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
        });
      }
      return pharmacies;
    };

    // Function to filter pharmacies based on drawn shape
    const filterByShape = (layer: L.Layer) => {
      const basePharmacies = filterByLocation();
      return basePharmacies.filter(pharmacy => {
        if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
        const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
        
        if (layer instanceof L.Circle) {
          return layer.getBounds().contains(pharmacyLatLng);
        } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
          return layer.getBounds().contains(pharmacyLatLng);
        }
        return false;
      });
    };

    // Initial pharmacy list based on location mode
    onPharmaciesInShape(filterByLocation());

    const drawControl = new (L.Control as any).Draw(drawOptions);
    map.addControl(drawControl);

    map.on(L.Draw.Event.DRAWSTART, () => {
      drawnItems.clearLayers();
    });

    map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      
      // Filter pharmacies based on shape and current location mode
      const filteredPharmacies = filterByShape(layer);
      onPharmaciesInShape(filteredPharmacies);

      // Show toast with number of pharmacies in shape
      toast({
        title: "Shape drawn",
        description: `Found ${filteredPharmacies.length} pharmacies in this area`,
      });
    });

    map.on(L.Draw.Event.DELETED, () => {
      // When shape is deleted, reset to initial state based on location mode
      const filteredPharmacies = filterByLocation();
      onPharmaciesInShape(filteredPharmacies);
      
      toast({
        title: "Shape deleted",
        description: `Showing ${filteredPharmacies.length} pharmacies`,
      });
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [coordinates, map, pharmacies, onPharmaciesInShape, showDefaultLocation]);
  
  return null;
}
