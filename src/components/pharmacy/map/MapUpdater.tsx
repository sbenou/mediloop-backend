
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { toast } from "@/components/ui/use-toast";

interface MapUpdaterProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
  defaultZoom?: number;
}

export function MapUpdater({ coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation, defaultZoom = 10 }: MapUpdaterProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) {
      console.log('MapUpdater: map object is null or undefined');
      return;
    }
    
    console.log('MapUpdater: initializing with map object', { mapExists: !!map });
    console.log('MapUpdater: leaflet version:', L.version);
    console.log('MapUpdater: leaflet draw available:', !!L.Control?.Draw);
    
    // Clean up function declaration - for later use
    let cleanupFunctions: (() => void)[] = [];

    try {
      // Validate coordinates
      const validCoordinates = coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lon === 'number';
      
      // Center map on coordinates
      const center = validCoordinates ? 
        [coordinates.lat, coordinates.lon] : 
        [49.8153, 6.1296]; // Luxembourg center coordinates
      
      const zoomLevel = showDefaultLocation ? 13 : defaultZoom;
      
      console.log('MapUpdater: setting view', { center, zoomLevel });
      
      // Set the view on the map - this is essential since we removed the props from MapContainer
      map.setView(center as L.LatLngExpression, zoomLevel);
      
      // Also enable scroll wheel zoom since we removed that prop from MapContainer
      map.scrollWheelZoom.enable();

      // Set up feature group for drawn items
      console.log('MapUpdater: creating feature group for drawn items');
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      
      // Add to cleanup
      cleanupFunctions.push(() => {
        try {
          console.log('MapUpdater: removing drawn items layer');
          map.removeLayer(drawnItems);
        } catch (err) {
          console.error("Error removing drawn items layer:", err);
        }
      });

      // Check if L.Control.Draw is available
      if (!L.Control || !L.Control.Draw) {
        console.error("Leaflet Draw plugin not available");
        return;
      }

      console.log('MapUpdater: creating draw control');
      
      // Create draw control
      const drawControl = new L.Control.Draw({
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

      // Filter pharmacies based on user location
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

      // Check if a point is inside a circle
      const isPointInCircle = (point: L.LatLng, circle: L.Circle) => {
        try {
          const center = circle.getLatLng();
          const radius = circle.getRadius();
          return center.distanceTo(point) <= radius;
        } catch (err) {
          console.error("Error in isPointInCircle:", err);
          return false;
        }
      };

      // Check if a point is inside a polygon or rectangle
      const isPointInPolygon = (point: L.LatLng, polygon: L.Polygon | L.Rectangle) => {
        try {
          const bounds = polygon.getBounds();
          if (!bounds.contains(point)) return false;

          if (polygon instanceof L.Rectangle) return true;

          // For complex polygons, get the coordinates
          let latLngs: L.LatLng[] = [];
          
          try {
            const firstLatLngs = polygon.getLatLngs()[0];
            latLngs = Array.isArray(firstLatLngs) ? firstLatLngs as L.LatLng[] : [];
          } catch (err) {
            console.error("Error getting latLngs:", err);
            return false;
          }
          
          if (latLngs.length === 0) return false;
          
          // Ray casting algorithm for point in polygon check
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

      // Filter pharmacies based on drawn shape
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

      // Initial pharmacy list
      try {
        console.log('MapUpdater: setting initial filtered pharmacies');
        const initialFiltered = filterByLocation();
        onPharmaciesInShape(initialFiltered);
      } catch (err) {
        console.error("Error setting initial pharmacies:", err);
        onPharmaciesInShape([]);
      }

      // Add draw control to map
      try {
        console.log('MapUpdater: adding draw control to map');
        map.addControl(drawControl);
        
        // Add to cleanup
        cleanupFunctions.push(() => {
          try {
            console.log('MapUpdater: removing draw control');
            map.removeControl(drawControl);
          } catch (controlErr) {
            console.error("Error removing draw control:", controlErr);
          }
        });
      } catch (err) {
        console.error("Error adding draw control:", err);
      }

      // Event handlers for drawing
      const handleDrawStart = (e: any) => {
        console.log('MapUpdater: draw start event triggered', e?.type);
        try {
          drawnItems.clearLayers();
        } catch (err) {
          console.error("Error in draw start handler:", err);
        }
      };

      const handleDrawCreated = (e: any) => {
        console.log('MapUpdater: draw created event triggered', e?.type);
        try {
          if (!e || !e.layer) {
            console.error("Draw created event missing layer");
            return;
          }
          
          const layer = e.layer;
          console.log('MapUpdater: adding drawn layer to feature group', {
            layerType: e.layerType,
            hasLayer: !!layer
          });
          
          drawnItems.addLayer(layer);
          
          // Filter pharmacies based on shape
          const filteredPharmacies = filterByShape(layer);
          console.log(`MapUpdater: filtered pharmacies`, {
            count: filteredPharmacies.length,
            totalAvailable: pharmacies.length
          });
          
          onPharmaciesInShape(filteredPharmacies);

          // Show toast with number of pharmacies
          toast({
            title: "Shape drawn",
            description: `Found ${filteredPharmacies.length} pharmacies in this area`,
          });
        } catch (err) {
          console.error("Error in draw created handler:", err);
        }
      };

      const handleDrawDeleted = (e: any) => {
        console.log('MapUpdater: draw deleted event triggered', e?.type);
        try {
          // Reset to initial state
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

      // Log the available Leaflet Draw events
      try {
        console.log('MapUpdater: available Draw events:', {
          drawEventExists: !!L.Draw,
          drawEventNames: L.Draw && L.Draw.Event ? Object.keys(L.Draw.Event) : 'none'
        });
      } catch (err) {
        console.error("Error checking Draw events:", err);
      }

      // Use explicit event names as strings that don't depend on L.Draw.Event object
      // These are the standard event names in Leaflet Draw documentation
      console.log('MapUpdater: attaching event handlers using standard event names');
      
      map.on('draw:drawstart', handleDrawStart);
      console.log('MapUpdater: attached draw:drawstart event handler');
      
      map.on('draw:created', handleDrawCreated);
      console.log('MapUpdater: attached draw:created event handler');
      
      map.on('draw:deleted', handleDrawDeleted);
      console.log('MapUpdater: attached draw:deleted event handler');
      
      // Add to cleanup: remove event listeners
      cleanupFunctions.push(() => {
        console.log('MapUpdater: removing event listeners');
        
        try {
          map.off('draw:drawstart', handleDrawStart);
          console.log('MapUpdater: removed draw:drawstart event handler');
        } catch (err) {
          console.error("Error removing draw:drawstart event:", err);
        }
        
        try {
          map.off('draw:created', handleDrawCreated);
          console.log('MapUpdater: removed draw:created event handler');
        } catch (err) {
          console.error("Error removing draw:created event:", err);
        }
        
        try {
          map.off('draw:deleted', handleDrawDeleted);
          console.log('MapUpdater: removed draw:deleted event handler');
        } catch (err) {
          console.error("Error removing draw:deleted event:", err);
        }
      });
    } catch (err) {
      console.error("Error in MapUpdater useEffect:", err);
    }

    // Return cleanup function that calls all registered cleanup handlers
    return () => {
      console.log('MapUpdater: executing cleanup function');
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (err) {
          console.error("Error in cleanup function:", err);
        }
      });
    };
  }, [coordinates, map, pharmacies, onPharmaciesInShape, showDefaultLocation, defaultZoom]);
  
  console.log('MapUpdater: rendering (returns null)');
  return null;
}
