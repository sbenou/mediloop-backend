
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
  
  // Create a logger for this component to help diagnose issues
  const log = (message: string, data?: any) => {
    console.log(`MapUpdater: ${message}`, data);
  };
  
  log('component rendering', {
    mapExists: !!map,
    coordsExist: !!coordinates,
    pharmCount: pharmacies?.length || 0
  });
  
  // Update map view when coordinates change
  useEffect(() => {
    if (!map || !coordinates) return;
    
    try {
      if (showDefaultLocation && 
          typeof coordinates.lat === 'number' && 
          typeof coordinates.lon === 'number') {
        log('setting view to user location');
        map.setView([coordinates.lat, coordinates.lon], defaultZoom);
      }
    } catch (err) {
      log('error setting map view', err);
    }
  }, [map, coordinates, showDefaultLocation, defaultZoom]);
  
  // Initialize draw controls and handle shape-based filtering
  useEffect(() => {
    if (!map) {
      log('map object is not available');
      return;
    }

    // Clean up function for event listeners
    const cleanup = () => {
      log('cleanup function executing');
      
      try {
        // Safely remove event handlers if they were added
        if (map) {
          // Use explicit event handlers instead of anonymous functions
          map.off('draw:drawstart');
          map.off('draw:created');
          map.off('draw:deleted');
        }
        
        // Remove draw control
        if (drawControlRef.current) {
          try {
            map.removeControl(drawControlRef.current);
          } catch (err) {
            // Silently fail if already removed
          }
          drawControlRef.current = null;
        }
        
        // Remove drawn items layer
        if (drawnItemsRef.current) {
          try {
            map.removeLayer(drawnItemsRef.current);
          } catch (err) {
            // Silently fail if already removed
          }
          drawnItemsRef.current = null;
        }
      } catch (err) {
        log('error in cleanup', err);
      }
    };

    try {
      // Filter pharmacies based on location
      const filterByLocation = () => {
        try {
          const validCoordinates = coordinates && 
            typeof coordinates.lat === 'number' && 
            typeof coordinates.lon === 'number';
            
          if (showDefaultLocation && validCoordinates) {
            const userLocation = L.latLng(coordinates.lat, coordinates.lon);
            return pharmacies.filter(pharmacy => {
              if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
              try {
                const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
                return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
              } catch (err) {
                log('error calculating distance', err);
                return false;
              }
            });
          }
          return pharmacies || [];
        } catch (err) {
          log('error in filterByLocation', err);
          return pharmacies || [];
        }
      };

      // Check if a point is inside a shape
      const isPointInShape = (point: L.LatLng, layer: L.Layer) => {
        try {
          if (layer instanceof L.Circle) {
            const center = layer.getLatLng();
            const radius = layer.getRadius();
            return center.distanceTo(point) <= radius;
          } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            return layer.getBounds().contains(point);
          }
          return false;
        } catch (err) {
          log('error in isPointInShape', err);
          return false;
        }
      };

      // Filter pharmacies based on drawn shape
      const filterByShape = (layer: L.Layer) => {
        try {
          return pharmacies.filter(pharmacy => {
            if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
            try {
              const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
              return isPointInShape(pharmacyLatLng, layer);
            } catch (err) {
              log('error checking if pharmacy is in shape', err);
              return false;
            }
          });
        } catch (err) {
          log('error in filterByShape', err);
          return [];
        }
      };

      // Set initial filtered pharmacies
      try {
        log('setting initial filtered pharmacies');
        const initialFiltered = filterByLocation();
        onPharmaciesInShape(initialFiltered);
      } catch (err) {
        log('error setting initial pharmacies', err);
      }

      // Create feature group for drawn items if it doesn't exist
      if (!drawnItemsRef.current) {
        try {
          log('creating feature group for drawn items');
          drawnItemsRef.current = new L.FeatureGroup();
          map.addLayer(drawnItemsRef.current);
        } catch (err) {
          log('error creating feature group', err);
        }
      }

      // Create and add draw control if it doesn't exist
      if (!drawControlRef.current && drawnItemsRef.current) {
        try {
          log('creating new draw control');
          
          // Check if L.Control.Draw is available in a safer way
          if (typeof L.Control === 'object' && L.Control.Draw) {
            drawControlRef.current = new L.Control.Draw({
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
                featureGroup: drawnItemsRef.current,
                remove: true
              }
            });
            
            map.addControl(drawControlRef.current);
            log('draw control added successfully');
          } else {
            log('Leaflet Draw plugin not available');
          }
        } catch (err) {
          log('error creating draw control', err);
        }
      }

      // Define explicit named event handlers to avoid closure issues
      const handleDrawStart = () => {
        log('draw:drawstart event triggered');
        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
        }
      };

      const handleDrawCreated = (e: any) => {
        log('draw:created event triggered');
        if (!e || !e.layer) {
          log('draw created event missing layer');
          return;
        }
        
        const layer = e.layer;
        
        if (drawnItemsRef.current) {
          drawnItemsRef.current.clearLayers();
          drawnItemsRef.current.addLayer(layer);
          
          // Filter pharmacies based on shape
          const filteredPharmacies = filterByShape(layer);
          log('filtered pharmacies after draw', { count: filteredPharmacies.length });
          
          onPharmaciesInShape(filteredPharmacies);

          toast({
            title: "Shape drawn",
            description: `Found ${filteredPharmacies.length} pharmacies in this area`,
          });
        }
      };

      const handleDrawDeleted = () => {
        log('draw:deleted event triggered');
        // Reset to initial state
        const filteredPharmacies = filterByLocation();
        onPharmaciesInShape(filteredPharmacies);
        
        toast({
          title: "Shape deleted",
          description: `Showing ${filteredPharmacies.length} pharmacies`,
        });
      };

      // Add event handlers safely
      try {
        // Ensure we don't add duplicate handlers
        map.off('draw:drawstart').on('draw:drawstart', handleDrawStart);
        map.off('draw:created').on('draw:created', handleDrawCreated);
        map.off('draw:deleted').on('draw:deleted', handleDrawDeleted);
        log('event handlers attached');
      } catch (err) {
        log('error attaching event handlers', err);
      }
    } catch (err) {
      log('error in useEffect', err);
    }

    // Return cleanup function
    return cleanup;
  }, [map, coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation]);
  
  return null;
}
