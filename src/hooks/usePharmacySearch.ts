
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
      
      // Try to get from cache first
      const cacheKey = `pharmacies-${coordinates.lat}-${coordinates.lon}-${searchRadius}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // When searching for all pharmacies in Luxembourg, use Luxembourg's center coordinates
      // and a larger radius to cover the whole country
      const searchLat = coordinates.lat;
      const searchLon = coordinates.lon;
      const searchDist = searchRadius;

      const results = await searchPharmacies(searchLat, searchLon, searchDist);
      
      // Cache the results
      sessionStorage.setItem(cacheKey, JSON.stringify(results));
      return results;
    },
    enabled: !!coordinates,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
  });

  const searchPharmacy = (query: string) => {
    setSearch(query);
    // In a real implementation, this would filter pharmacies or trigger a new search
    console.log("Searching for pharmacy:", query);
  };

  const toggleView = () => {
    setIsMapView(prev => !prev);
  };

  return { 
    pharmacies: pharmacies || [], 
    isLoading,
    search,
    setSearch,
    searchPharmacy,
    isMapView,
    toggleView
  };
};
