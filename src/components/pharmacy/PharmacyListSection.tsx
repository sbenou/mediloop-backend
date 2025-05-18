
import { useEffect, useState, useCallback } from "react";
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { PharmacyList } from "./list/PharmacyList";
import { PharmacyMap } from "./map/PharmacyMap";
import { toast } from "@/components/ui/use-toast";

// Initialize Leaflet.draw localization and measurement formatting
// We're moving this inside a try/catch to prevent errors
if (typeof window !== 'undefined') {
  try {
    if (L.drawLocal) {
      L.drawLocal.draw.handlers.circle.tooltip.start = 'Click and drag to draw circle';
      L.drawLocal.draw.handlers.circle.radius = 'Radius';
      L.drawLocal.draw.handlers.polygon.tooltip.start = 'Click to start drawing area';
      L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Click to continue drawing shape';
      L.drawLocal.draw.handlers.polygon.tooltip.end = 'Click first point to close this shape';
      L.drawLocal.draw.handlers.rectangle.tooltip.start = 'Click and drag to draw rectangle';

      (L.drawLocal.draw.toolbar.buttons as any).polygon = 'Draw a polygon';
      (L.drawLocal.draw.toolbar.buttons as any).rectangle = 'Draw a rectangle';
      (L.drawLocal.draw.toolbar.buttons as any).circle = 'Draw a circle';
    }
  } catch (err) {
    console.error('Error initializing Leaflet.draw localization:', err);
  }
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
  const [showDefaultLocation, setShowDefaultLocation] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Reset error state when pharmacies or coordinates change
  useEffect(() => {
    setErrorState(null);
  }, [pharmacies, coordinates]);

  const handleLocationToggle = useCallback((checked: boolean) => {
    setShowDefaultLocation(checked);
    if (checked) {
      toast({
        title: "Using location",
        description: "Currently showing pharmacies within 2km of your location",
      });
    }
  }, []);

  const handlePharmaciesInShape = useCallback((updatedPharmacies: any[]) => {
    try {
      if (!Array.isArray(updatedPharmacies)) {
        console.error("Invalid pharmacies data:", updatedPharmacies);
        setFilteredPharmacies(pharmacies); // Fallback to all pharmacies
        return;
      }
      
      setFilteredPharmacies(updatedPharmacies);
    } catch (error) {
      console.error("Error handling filtered pharmacies:", error);
      setFilteredPharmacies(pharmacies); // Fallback to all pharmacies
    }
  }, [pharmacies]);
  
  // Initial setup when pharmacies or coordinates change
  useEffect(() => {
    setFilteredPharmacies(pharmacies);
  }, [pharmacies]);

  // Filter by location effect
  useEffect(() => {
    if (!coordinates || !showDefaultLocation || !pharmacies.length) return;
    
    try {
      const userLocation = L.latLng(coordinates.lat, coordinates.lon);
      const nearbyPharmacies = pharmacies.filter(pharmacy => {
        if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
        try {
          const pharmLat = parseFloat(pharmacy.coordinates.lat);
          const pharmLon = parseFloat(pharmacy.coordinates.lon);
          
          if (isNaN(pharmLat) || isNaN(pharmLon)) return false;
          
          const pharmacyLocation = L.latLng(pharmLat, pharmLon);
          const distance = userLocation.distanceTo(pharmacyLocation);
          
          // Add distance to pharmacy for display
          pharmacy.distance = (distance / 1000).toFixed(1);
          
          return distance <= 2000; // 2km radius
        } catch (error) {
          console.error('Error calculating distance for pharmacy:', error);
          return false;
        }
      });
      
      setFilteredPharmacies(nearbyPharmacies);
    } catch (error) {
      console.error('Error filtering pharmacies by location:', error);
      setFilteredPharmacies(pharmacies);
    }
  }, [showDefaultLocation, coordinates, pharmacies]);

  if (!coordinates) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading location data...</p>
      </div>
    );
  }

  return (
    <div className="mt-24 grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
      <PharmacyList
        pharmacies={filteredPharmacies}
        isLoading={isLoading}
        defaultPharmacyId={defaultPharmacyId}
        onPharmacySelect={onPharmacySelect}
        onSetDefaultPharmacy={onSetDefaultPharmacy}
        showDefaultLocation={showDefaultLocation}
        onLocationToggle={handleLocationToggle}
      />
      
      <PharmacyMap
        coordinates={coordinates}
        pharmacies={pharmacies}
        filteredPharmacies={filteredPharmacies}
        onPharmaciesInShape={handlePharmaciesInShape}
        showDefaultLocation={showDefaultLocation}
      />
    </div>
  );
};

export default PharmacyListSection;
