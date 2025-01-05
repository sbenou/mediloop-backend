import { useQuery } from "@tanstack/react-query";
import { searchPharmacies } from "@/lib/overpass";

export const usePharmacySearch = (
  coordinates: { lat: number; lon: number } | null,
  searchRadius: number = 5000
) => {
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

      const results = await searchPharmacies(coordinates.lat, coordinates.lon, searchRadius);
      
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

  return { pharmacies: pharmacies || [], isLoading };
};