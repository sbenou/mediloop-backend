
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { toast } from "@/components/ui/use-toast";

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
}

export function SimplifiedMapUpdater({ 
  coordinates, 
  pharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation 
}: SimplifiedMapUpdaterProps) {
  const map = useMap();
  
  // Update map view when coordinates change
  useEffect(() => {
    if (!map || !coordinates) return;
    
    if (showDefaultLocation && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lon === 'number') {
      map.setView([coordinates.lat, coordinates.lon], 10);
    }
  }, [map, coordinates, showDefaultLocation]);
  
  // Initialize draw controls and handle shape-based filtering
  useEffect(() => {
    if (!map) return;
    
    // Create feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Draw control initialization
    try {
      const drawControl = new L.Control.Draw({
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
    } catch (err) {
      console.error('Error creating draw control:', err);
    }
    
    // Filter pharmacies based on location
    const filterByLocation = () => {
      if (showDefaultLocation && coordinates && 
          typeof coordinates.lat === 'number' && 
          typeof coordinates.lon === 'number') {
        const userLocation = L.latLng(coordinates.lat, coordinates.lon);
        return pharmacies.filter(pharmacy => {
          if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
          const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
          return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
        });
      }
      return pharmacies || [];
    };
    
    // Check if a point is inside a shape
    const isPointInShape = (point: L.LatLng, layer: L.Layer) => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        const radius = layer.getRadius();
        return center.distanceTo(point) <= radius;
      } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        return layer.getBounds().contains(point);
      }
      return false;
    };
    
    // Filter pharmacies based on drawn shape
    const filterByShape = (layer: L.Layer) => {
      return pharmacies.filter(pharmacy => {
        if (!pharmacy?.coordinates?.lat || !pharmacy?.coordinates?.lon) return false;
        const pharmacyLatLng = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
        return isPointInShape(pharmacyLatLng, layer);
      });
    };
    
    // Set initial filtered pharmacies
    const initialFiltered = filterByLocation();
    onPharmaciesInShape(initialFiltered);
    
    // Define event handlers
    const handleDrawStart = () => {
      drawnItems.clearLayers();
    };
    
    const handleDrawCreated = (e: any) => {
      const layer = e.layer;
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);
      
      // Filter pharmacies based on shape
      const filteredPharmacies = filterByShape(layer);
      onPharmaciesInShape(filteredPharmacies);
      
      toast({
        title: "Shape drawn",
        description: `Found ${filteredPharmacies.length} pharmacies in this area`,
      });
    };
    
    const handleDrawDeleted = () => {
      // Reset to initial state
      const filteredPharmacies = filterByLocation();
      onPharmaciesInShape(filteredPharmacies);
      
      toast({
        title: "Shape deleted",
        description: `Showing ${filteredPharmacies.length} pharmacies`,
      });
    };
    
    // Add event listeners with basic error handling
    map.on('draw:drawstart', handleDrawStart);
    map.on('draw:created', handleDrawCreated);
    map.on('draw:deleted', handleDrawDeleted);
    
    // Clean up event listeners on unmount
    return () => {
      try {
        if (map) {
          map.off('draw:drawstart', handleDrawStart);
          map.off('draw:created', handleDrawCreated);
          map.off('draw:deleted', handleDrawDeleted);
        }
        
        // Remove control and layers
        try {
          map.removeLayer(drawnItems);
        } catch (e) {
          console.error('Error removing layers:', e);
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    };
  }, [map, coordinates, pharmacies, onPharmaciesInShape, showDefaultLocation]);
  
  return null;
}
