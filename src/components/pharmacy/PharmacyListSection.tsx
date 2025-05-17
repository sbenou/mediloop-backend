
import { useEffect, useState, useCallback } from "react";
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { PharmacyList } from "./list/PharmacyList";
import { PharmacyMap } from "./map/PharmacyMap";
import { toast } from "@/components/ui/use-toast";
import { calculateDistance } from '@/lib/utils/distance';

// Ensure leaflet is properly initialized on the client side
if (typeof window !== 'undefined') {
  // Add a global error handler for the "a is not a function" error
  window.addEventListener('error', (e) => {
    if (e.message && (e.message.includes('a is not a function') || e.message.includes('touchleave'))) {
      console.warn('Caught global Leaflet error:', e.message);
      e.preventDefault();
      return true;
    }
    return false;
  }, true);
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
  
  // Calculate distances and update filtered pharmacies when location or pharmacy data changes
  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lon) {
      setFilteredPharmacies(pharmacies);
      return;
    }

    try {
      // Add distance property to all pharmacies
      const pharmaciesWithDistance = pharmacies.map(pharmacy => {
        const updatedPharmacy = {...pharmacy};
        
        if (pharmacy.coordinates?.lat && pharmacy.coordinates?.lon) {
          try {
            // Calculate distance using leaflet
            const userPos = L.latLng(coordinates.lat, coordinates.lon);
            const pharmPos = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
            const distanceInMeters = userPos.distanceTo(pharmPos);
            
            // Add distance in km with one decimal place
            updatedPharmacy.distance = (distanceInMeters / 1000).toFixed(1);
            updatedPharmacy.distanceRaw = distanceInMeters; // For sorting
            
            console.log(`Distance to ${pharmacy.name}: ${updatedPharmacy.distance}km`);
          } catch (e) {
            console.error("Error calculating distance:", e);
          }
        }
        
        return updatedPharmacy;
      });
      
      // Filter if showing only nearby pharmacies
      if (showDefaultLocation) {
        const nearbyPharmacies = pharmaciesWithDistance.filter(pharmacy => {
          return pharmacy.distanceRaw && pharmacy.distanceRaw <= 2000; // 2km radius
        });
        
        setFilteredPharmacies(nearbyPharmacies);
      } else {
        setFilteredPharmacies(pharmaciesWithDistance);
      }
      
    } catch (error) {
      console.error('Error processing pharmacies with location data:', error);
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
