
import { useEffect, useRef } from 'react';
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
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  
  console.log('MapUpdater: rendering', {
    mapExists: !!map,
    coordsExist: !!coordinates,
    pharmCount: pharmacies.length,
    leafletVersion: L.version,
    drawExists: typeof L.Control.Draw !== 'undefined'
  });
  
  useEffect(() => {
    if (!map) {
      console.error('MapUpdater: map object is null or undefined');
      return;
    }
    
    console.log('MapUpdater: initializing map', {
      mapCenter: map.getCenter(),
      mapZoom: map.getZoom(),
      leafletVersion: L.version
    });
    
    try {
      // Validate coordinates
      const validCoordinates = coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lon === 'number';
      
      // Center map on coordinates if needed
      if (validCoordinates && showDefaultLocation) {
        console.log('MapUpdater: setting view to user location');
        map.setView([coordinates.lat, coordinates.lon], 13);
      }
      
      // Set up feature group for drawn items if not already created
      if (!drawnItemsRef.current) {
        console.log('MapUpdater: creating new feature group for drawn items');
        drawnItemsRef.current = new L.FeatureGroup();
        map.addLayer(drawnItemsRef.current);
      }
      
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
        console.log('MapUpdater: initial pharmacies set', { count: initialFiltered.length });
      } catch (err) {
        console.error("Error setting initial pharmacies:", err);
        onPharmaciesInShape([]);
      }

      // Remove existing draw control if it exists
      if (drawControlRef.current) {
        console.log('MapUpdater: removing existing draw control');
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }

      // Create and add draw control
      if (!drawControlRef.current && drawnItemsRef.current) {
        try {
          console.log('MapUpdater: creating new draw control');
          
          // Check if L.Control.Draw is available
          if (!L.Control || !L.Control.Draw) {
            console.error("Leaflet Draw plugin not available");
            return;
          }
          
          drawControlRef.current = new L.Control.Draw({
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
              featureGroup: drawnItemsRef.current,
              remove: true
            }
          });
          
          map.addControl(drawControlRef.current);
          console.log('MapUpdater: draw control added successfully');
        } catch (err) {
          console.error("Error creating or adding draw control:", err);
        }
      }

      // Define event handlers
      const handleDrawStart = () => {
        console.log('MapUpdater: draw:drawstart event triggered');
        try {
          if (drawnItemsRef.current) {
            drawnItemsRef.current.clearLayers();
          }
        } catch (err) {
          console.error("Error in draw start handler:", err);
        }
      };

      const handleDrawCreated = (e: any) => {
        console.log('MapUpdater: draw:created event triggered', {
          layerType: e?.layerType,
          hasLayer: !!e?.layer
        });
        
        try {
          if (!e || !e.layer) {
            console.error("Draw created event missing layer");
            return;
          }
          
          const layer = e.layer;
          
          if (drawnItemsRef.current) {
            drawnItemsRef.current.clearLayers();
            drawnItemsRef.current.addLayer(layer);
            
            // Filter pharmacies based on shape
            const filteredPharmacies = filterByShape(layer);
            console.log('MapUpdater: filtered pharmacies after draw', {
              count: filteredPharmacies.length,
              totalAvailable: pharmacies.length
            });
            
            onPharmaciesInShape(filteredPharmacies);

            // Show toast with number of pharmacies
            toast({
              title: "Shape drawn",
              description: `Found ${filteredPharmacies.length} pharmacies in this area`,
            });
          }
        } catch (err) {
          console.error("Error in draw created handler:", err);
        }
      };

      const handleDrawDeleted = () => {
        console.log('MapUpdater: draw:deleted event triggered');
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

      // Safety check before attaching events
      // First, explicitly remove any previous event handlers
      map.off('draw:drawstart');
      map.off('draw:created');
      map.off('draw:deleted');
      
      // Then attach event handlers with the correct string-based event names
      console.log('MapUpdater: attaching event handlers');
      map.on('draw:drawstart', handleDrawStart);
      map.on('draw:created', handleDrawCreated);
      map.on('draw:deleted', handleDrawDeleted);
      
      console.log('MapUpdater: all event handlers attached');
    } catch (err) {
      console.error("Error in MapUpdater useEffect:", err);
    }

    // Return cleanup function
    return () => {
      console.log('MapUpdater: executing cleanup function');
      
      // Clean up event listeners
      try {
        console.log('MapUpdater: removing event listeners');
        map.off('draw:drawstart');
        map.off('draw:created');
        map.off('draw:deleted');
      } catch (err) {
        console.error("Error removing event listeners:", err);
      }
      
      // Remove draw control
      try {
        if (drawControlRef.current) {
          console.log('MapUpdater: removing draw control');
          map.removeControl(drawControlRef.current);
          drawControlRef.current = null;
        }
      } catch (err) {
        console.error("Error removing draw control:", err);
      }
      
      // Remove drawn items layer
      try {
        if (drawnItemsRef.current) {
          console.log('MapUpdater: removing drawn items layer');
          map.removeLayer(drawnItemsRef.current);
          drawnItemsRef.current = null;
        }
      } catch (err) {
        console.error("Error removing drawn items layer:", err);
      }
    };
  }, [coordinates, map, pharmacies, onPharmaciesInShape, showDefaultLocation, defaultZoom]);
  
  return null;
}
