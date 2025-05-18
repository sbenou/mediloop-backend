
import React, { useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Pharmacy } from '@/lib/types/overpass.types';
import { LocalCache } from '@/lib/cache';

interface StaticMapComponentProps {
  pharmacies: Pharmacy[];
  userLocation: { lat: number; lon: number } | null;
  onPharmaciesInShape: (pharmacies: Pharmacy[]) => void;
}

/**
 * A completely static map component that doesn't use Leaflet or MapboxGL
 * This reduces API calls and serves as a lightweight alternative
 */
const StaticMapComponent: React.FC<StaticMapComponentProps> = ({
  pharmacies,
  userLocation,
  onPharmaciesInShape
}) => {
  // Pass all pharmacies to parent on mount
  useEffect(() => {
    console.log('StaticMapComponent: Passing all pharmacies to parent');
    onPharmaciesInShape(pharmacies);
  }, [pharmacies, onPharmaciesInShape]);
  
  // Generate a static map URL using Mapbox with markers
  const mapUrl = useMemo(() => {
    if (!userLocation) return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    
    try {
      // Create cache key based on location (rounded to 3 decimal places for caching similar positions)
      const roundedLat = Math.round(userLocation.lat * 1000) / 1000;
      const roundedLon = Math.round(userLocation.lon * 1000) / 1000;
      const cacheKey = `static-map-${roundedLat}-${roundedLon}-11`;
      
      // Check cache first
      const cachedUrl = LocalCache.get<string>(cacheKey);
      if (cachedUrl) {
        console.log('Using cached static map URL');
        return cachedUrl;
      }
      
      // Instead of adding all markers (which can cause URL length issues),
      // just show a subset of markers (max 25) to avoid URL length limits
      let markersString = '';
      const visiblePharmacies = pharmacies.slice(0, 25);
      
      visiblePharmacies.forEach((pharmacy) => {
        if (pharmacy.coordinates && pharmacy.coordinates.lat && pharmacy.coordinates.lon) {
          // Add pin for each pharmacy
          markersString += `pin-s+1e88e5(${pharmacy.coordinates.lon},${pharmacy.coordinates.lat}),`;
        }
      });
      
      // Remove trailing comma
      if (markersString.endsWith(',')) {
        markersString = markersString.slice(0, -1);
      }
      
      // Generate URL with markers
      const token = 'pk.eyJ1IjoiZGVtb2FjY291bnQyMDIwIiwiYSI6ImNrY3M1MHNxcDBrNXAycW1pcngzaGk5cDEifQ.sTh_v9zXhaUXuR2-tUMmVw';
      const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${markersString ? markersString + '/' : ''}${userLocation.lon},${userLocation.lat},11,0/600x400@2x?access_token=${token}`;
      
      // Cache the URL
      LocalCache.set(cacheKey, url);
      
      return url;
    } catch (error) {
      console.error('Error generating static map URL:', error);
      return "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
    }
  }, [userLocation, pharmacies]);
  
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0 h-full relative">
        {/* Static map image */}
        <div className="w-full h-full bg-gray-100 relative">
          <img 
            src={mapUrl}
            alt="Static pharmacy map" 
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=Map+unavailable";
            }}
          />
          <div className="absolute bottom-2 right-2 bg-white/80 text-xs text-gray-600 px-1 py-0.5 rounded">
            {pharmacies.length} pharmacies found in this area
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticMapComponent;
