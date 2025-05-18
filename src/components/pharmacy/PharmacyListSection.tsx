
import { useEffect, useState, useCallback } from "react";
import { PharmacyList } from "./list/PharmacyList";
import { PharmacyMap } from "./map/PharmacyMap";
import { toast } from "@/components/ui/use-toast";
import mapboxgl from 'mapbox-gl';

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
      const userLng = coordinates.lon;
      const userLat = coordinates.lat;
      
      const nearbyPharmacies = pharmacies.filter(pharmacy => {
        if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
        try {
          const pharmLat = parseFloat(pharmacy.coordinates.lat);
          const pharmLon = parseFloat(pharmacy.coordinates.lon);
          
          if (isNaN(pharmLat) || isNaN(pharmLon)) return false;
          
          // Calculate distance using Mapbox's turf.js or a simplified distance calculation
          // Here we use the Haversine formula directly for simplicity
          const R = 6371; // Earth radius in km
          const dLat = (pharmLat - userLat) * Math.PI / 180;
          const dLon = (pharmLon - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(pharmLat * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          // Add distance to pharmacy for display
          pharmacy.distance = distance.toFixed(1);
          
          return distance <= 2; // 2km radius
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
