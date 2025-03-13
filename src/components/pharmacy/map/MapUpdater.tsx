import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from "@/components/ui/use-toast";

interface MapUpdaterProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
  defaultZoom?: number; // Add default zoom prop
}

export function MapUpdater({ coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation, defaultZoom = 10 }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    try {
      // Validate coordinates
      const validCoordinates = coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lon === 'number';
      
      // Center map on Luxembourg if not showing default location
      const defaultView = showDefaultLocation && validCoordinates
        ? [coordinates.lat, coordinates.lon]
        : [49.8153, 6.1296]; // Luxembourg center coordinates
      
      const zoomLevel = showDefaultLocation ? 13 : defaultZoom;
      map.setView(defaultView as L.LatLngExpression, zoomLevel);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new (L.Control as any).Draw({
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
      });

      // Function to filter pharmacies based on user location
      const filterByLocation = () => {
        try {
          if (showDefaultLocation && validCoordinates) {
            const userLocation = L.latLng(coordinates.lat, coordinates.lon);
            return Array.isArray(pharmacies) ? pharmacies.filter(pharmacy => {
              if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
              try {
                const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
                return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
              } catch (err) {
                console.error("Error calculating distance:", err);
                return false;
              }
            }) : [];
          }
          return Array.isArray(pharmacies) ? pharmacies : [];
        } catch (err) {
          console.error("Error in filterByLocation:", err);
          return Array.isArray(pharmacies) ? pharmacies : [];
        }
      };

      // Function to check if a point is inside a circle
      const isPointInCircle = (point: L.LatLng, circle: L.Circle) => {
        try {
          const center = circle.getLatLng();
          const radius = circle.getRadius();
          const distance = center.distanceTo(point);
          return distance <= radius;
        } catch (err) {
          console.error("Error in isPointInCircle:", err);
          return false;
        }
      };

      // Function to check if a point is inside a polygon or rectangle
      const isPointInPolygon = (point: L.LatLng, polygon: L.Polygon | L.Rectangle) => {
        try {
          const bounds = polygon.getBounds();
          if (!bounds.contains(point)) return false;

          if (polygon instanceof L.Rectangle) return true;

          // For complex polygons, we need to check if the point is actually inside
          let latLngs: L.LatLng[] = [];
          
          // Safely get the latLngs
          try {
            const firstLatLngs = polygon.getLatLngs()[0];
            latLngs = Array.isArray(firstLatLngs) ? firstLatLngs as L.LatLng[] : [];
          } catch (err) {
            console.error("Error getting latLngs:", err);
            return false;
          }
          
          if (latLngs.length === 0) return false;
          
          const x = point.lng;
          const y = point.lat;
          let inside = false;

          for (let i = 0, j = latLngs.length - 1; i < latLngs.length; j = i++) {
            if (!latLngs[i] || !latLngs[j]) continue;
            
            const xi = latLngs[i].lng;
            const yi = latLngs[i].lat;
            const xj = latLngs[j].lng;
            const yj = latLngs[j].lat;

            const intersect = ((yi > y) !== (yj > y)) &&
              (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
          }

          return inside;
        } catch (err) {
          console.error("Error in isPointInPolygon:", err);
          return false;
        }
      };

      // Function to filter pharmacies based on drawn shape
      const filterByShape = (layer: L.Layer) => {
        try {
          const basePharmacies = filterByLocation();
          return basePharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            
            try {
              const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
              
              if (layer instanceof L.Circle) {
                return isPointInCircle(pharmacyLatLng, layer);
              } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                return isPointInPolygon(pharmacyLatLng, layer);
              }
            } catch (err) {
              console.error("Error checking if pharmacy is in shape:", err);
            }
            
            return false;
          });
        } catch (err) {
          console.error("Error in filterByShape:", err);
          return [];
        }
      };

      // Initial pharmacy list based on location mode
      try {
        const initialFiltered = filterByLocation();
        onPharmaciesInShape(initialFiltered);
      } catch (err) {
        console.error("Error setting initial pharmacies:", err);
        onPharmaciesInShape([]);
      }

      try {
        map.addControl(drawControl);
      } catch (err) {
        console.error("Error adding draw control:", err);
      }

      // Set up event handlers with try-catch blocks
      const handleDrawStart = () => {
        try {
          drawnItems.clearLayers();
        } catch (err) {
          console.error("Error in draw start handler:", err);
        }
      };

      const handleDrawCreated = (event: any) => {
        try {
          if (!event || !event.layer) return;
          
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
        } catch (err) {
          console.error("Error in draw created handler:", err);
        }
      };

      const handleDrawDeleted = () => {
        try {
          // When shape is deleted, reset to initial state based on location mode
          const filteredPharmacies = filterByLocation();
          onPharmaciesInShape(filteredPharmacies);
          
          toast({
            title: "Shape deleted",
            description: `Showing ${filteredPharmacies.length} pharmacies`,
          });
        } catch (err) {
          console.error("Error in draw deleted handler:", err);
        }
      };

      // Add event listeners
      map.on(L.Draw.Event.DRAWSTART, handleDrawStart);
      map.on(L.Draw.Event.CREATED, handleDrawCreated);
      map.on(L.Draw.Event.DELETED, handleDrawDeleted);

      return () => {
        try {
          map.off(L.Draw.Event.DRAWSTART, handleDrawStart);
          map.off(L.Draw.Event.CREATED, handleDrawCreated);
          map.off(L.Draw.Event.DELETED, handleDrawDeleted);
          
          try {
            map.removeControl(drawControl);
          } catch (controlErr) {
            console.error("Error removing draw control:", controlErr);
          }
          
          try {
            map.removeLayer(drawnItems);
          } catch (layerErr) {
            console.error("Error removing drawn items layer:", layerErr);
          }
        } catch (err) {
          console.error("Error in cleanup function:", err);
        }
      };
    } catch (err) {
      console.error("Error in MapUpdater useEffect:", err);
    }
  }, [coordinates, map, pharmacies, onPharmaciesInShape, showDefaultLocation, defaultZoom]);
  
  return null;
}
