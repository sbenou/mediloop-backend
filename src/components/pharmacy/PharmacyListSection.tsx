
import { useEffect, useState } from "react";
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { PharmacyList } from "./list/PharmacyList";
import { PharmacyMap } from "./map/PharmacyMap";

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

  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lon) {
      setFilteredPharmacies(pharmacies);
      return;
    }

    if (showDefaultLocation) {
      try {
        const userLocation = L.latLng(coordinates.lat, coordinates.lon);
        const nearbyPharmacies = pharmacies.filter(pharmacy => {
          if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return false;
          try {
            const pharmacyLocation = L.latLng(pharmacy.coordinates.lat, pharmacy.coordinates.lon);
            return userLocation.distanceTo(pharmacyLocation) <= 2000; // 2km radius
          } catch (error) {
            console.error('Error calculating distance for pharmacy:', pharmacy, error);
            return false;
          }
        });
        setFilteredPharmacies(nearbyPharmacies);
      } catch (error) {
        console.error('Error creating user location:', error);
        setFilteredPharmacies(pharmacies);
      }
    } else {
      setFilteredPharmacies(pharmacies);
    }
  }, [showDefaultLocation, coordinates, pharmacies]);

  if (!coordinates) {
    return <div>Loading location...</div>;
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
        onLocationToggle={setShowDefaultLocation}
      />
      
      <PharmacyMap
        coordinates={coordinates}
        pharmacies={pharmacies}
        onPharmaciesInShape={setFilteredPharmacies}
        showDefaultLocation={showDefaultLocation}
      />
    </div>
  );
};

export default PharmacyListSection;
