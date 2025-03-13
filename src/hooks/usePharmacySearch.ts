
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPharmacies } from "@/lib/overpass";

export const usePharmacySearch = (
  coordinates: { lat: number; lon: number } | null,
  searchRadius: number = 5000
) => {
  const [search, setSearch] = useState("");
  const [isMapView, setIsMapView] = useState(false);

  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ["pharmacies", coordinates?.lat, coordinates?.lon, searchRadius],
    queryFn: async () => {
      if (!coordinates) return [];
      
      try {
        // Validate coordinates
        if (typeof coordinates.lat !== 'number' || typeof coordinates.lon !== 'number') {
          console.error('Invalid coordinates:', coordinates);
          return [];
        }
        
        // Try to get from cache first
        const cacheKey = `pharmacies-${coordinates.lat}-${coordinates.lon}-${searchRadius}`;
        let cachedData;
        
        try {
          const cachedString = sessionStorage.getItem(cacheKey);
          if (cachedString) {
            cachedData = JSON.parse(cachedString);
            if (Array.isArray(cachedData)) {
              return cachedData;
            }
          }
        } catch (cacheError) {
          console.error("Error retrieving from cache:", cacheError);
        }

        // When searching for all pharmacies in Luxembourg, use Luxembourg's center coordinates
        // and a larger radius to cover the whole country
        const searchLat = coordinates.lat;
        const searchLon = coordinates.lon;
        const searchDist = searchRadius;

        const results = await searchPharmacies(searchLat, searchLon, searchDist);
        
        if (!Array.isArray(results)) {
          console.error('Invalid response from searchPharmacies:', results);
          return [];
        }
        
        // Cache the results
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(results));
        } catch (cacheError) {
          console.error("Error saving to cache:", cacheError);
        }
        
        return results;
      } catch (err) {
        console.error("Error in usePharmacySearch:", err);
        return [];
      }
    },
    enabled: !!coordinates,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
  });

  const searchPharmacy = (query: string) => {
    try {
      setSearch(query);
      console.log("Searching for pharmacy:", query);
    } catch (error) {
      console.error("Error in searchPharmacy:", error);
    }
  };

  const toggleView = () => {
    try {
      setIsMapView(prev => !prev);
    } catch (error) {
      console.error("Error in toggleView:", error);
    }
  };

  return { 
    pharmacies: Array.isArray(pharmacies) ? pharmacies : [], 
    isLoading,
    search,
    setSearch,
    searchPharmacy,
    isMapView,
    toggleView
  };
};
