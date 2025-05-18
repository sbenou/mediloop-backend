
import { useEffect, useState, useMemo, useRef } from 'react';
import { toast } from "@/components/ui/use-toast";
import { Map as MapIcon } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocalCache } from '@/lib/cache';
import { getMapboxToken } from '@/services/mapbox';
import { MapboxMapUpdater } from './MapboxMapUpdater';

interface PharmacyMapProps {
  coordinates: { lat: number; lon: number };
  pharmacies: any[];
  filteredPharmacies: any[];
  onPharmaciesInShape: (pharmacies: any[]) => void;
  showDefaultLocation: boolean;
  onMapError?: () => void;
}

// Create a pharmacy marker element
const createPharmacyMarker = () => {
  const el = document.createElement('div');
  el.className = 'pharmacy-marker';
  el.style.width = '25px';
  el.style.height = '41px';
  el.style.backgroundImage = "url(https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png)";
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  return el;
};

// Create a map fallback component
const StaticMapFallback: React.FC<Omit<PharmacyMapProps, 'onMapError'>> = ({
  coordinates,
  pharmacies,
  filteredPharmacies,
  onPharmaciesInShape,
  showDefaultLocation
}) => {
  console.log('Rendering StaticMapFallback with', filteredPharmacies.length, 'pharmacies');
  
  // Generate static map URL with limited markers to avoid URL length issues
  const staticMapUrl = useMemo(() => {
    try {
      // Use Luxembourg's center coordinates as default
      const mapCenter = `${coordinates.lon},${coordinates.lat}`;
      const zoom = 12;
      const token = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';
      
      // No markers for simplicity (to avoid URL length issues)
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${mapCenter},${zoom},0,0/600x400@2x?access_token=${token}`;
    } catch (error) {
      console.error('Error generating static map URL:', error);
      return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    }
  }, [coordinates]);
  
  useEffect(() => {
    if (filteredPharmacies.length > 0) {
      console.log('Static map: passing filtered pharmacies to parent');
      onPharmaciesInShape(filteredPharmacies);
    }
  }, [filteredPharmacies, onPharmaciesInShape]);
  
  return (
    <div className="w-full h-full bg-gray-50 relative overflow-hidden rounded-md border border-gray-200">
      <img 
        src={staticMapUrl}
        alt="Static pharmacy map" 
        className="w-full h-full object-cover"
        loading="eager"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
        }}
      />
      <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-600 px-1 py-0.5 rounded">
        {filteredPharmacies.length} pharmacies found
      </div>
      
      {/* Overlay with pharmacy cards for better UX */}
      <div className="absolute top-2 left-2 max-h-[90%] w-64 overflow-y-auto">
        <div className="space-y-2 max-h-80 overflow-auto">
          {filteredPharmacies.slice(0, 5).map((pharmacy, index) => (
            <div 
              key={pharmacy.id || index}
              className="bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-sm border border-gray-100"
            >
              <p className="font-medium text-sm">{pharmacy.name || "Pharmacy"}</p>
              <p className="text-xs text-gray-600">{pharmacy.address || "No address"}</p>
            </div>
          ))}
          {filteredPharmacies.length > 5 && (
            <div className="text-xs text-center text-gray-500 pt-1">
              +{filteredPharmacies.length - 5} more pharmacies
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function PharmacyMap({ 
  coordinates, 
  pharmacies, 
  filteredPharmacies, 
  onPharmaciesInShape, 
  showDefaultLocation,
  onMapError
}: PharmacyMapProps) {
  console.log('PharmacyMap rendering with', filteredPharmacies.length, 'filtered pharmacies');
  
  // Always use static map for stability
  return (
    <StaticMapFallback
      coordinates={coordinates}
      pharmacies={pharmacies}
      filteredPharmacies={filteredPharmacies || pharmacies}
      onPharmaciesInShape={onPharmaciesInShape}
      showDefaultLocation={showDefaultLocation}
    />
  );
}
