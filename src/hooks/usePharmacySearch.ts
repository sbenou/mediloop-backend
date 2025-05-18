
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPharmacies } from "@/lib/overpass";
import { LocalCache } from "@/lib/cache";

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
        
        // Round coordinates to 4 decimal places for better cache hits
        // This gives ~11m of precision which is plenty for our use case
        const roundedLat = Math.round(coordinates.lat * 10000) / 10000;
        const roundedLon = Math.round(coordinates.lon * 10000) / 10000;
        
        // Try to get from cache first
        const cacheKey = `pharmacies-${roundedLat}-${roundedLon}-${searchRadius}`;
        const cachedData = LocalCache.get(cacheKey);
        
        if (cachedData) {
          console.log('Using cached pharmacy data from LocalCache');
          return cachedData;
        }

        // When searching for all pharmacies in Luxembourg, use Luxembourg's center coordinates
        // and a larger radius to cover the whole country
        const searchLat = coordinates.lat;
        const searchLon = coordinates.lon;
        const searchDist = searchRadius;

        console.log('Fetching pharmacy data from API');
        const results = await searchPharmacies(searchLat, searchLon, searchDist);
        
        if (!Array.isArray(results)) {
          console.error('Invalid response from searchPharmacies:', results);
          return [];
        }
        
        // Cache the results
        LocalCache.set(cacheKey, results);
        
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
