import { useQuery } from "@tanstack/react-query";
import { searchPharmacies } from "@/lib/overpass";

export const usePharmacySearch = (
  coordinates: { lat: number; lon: number } | null,
  searchRadius: number = 5000
) => {
  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ["pharmacies", coordinates, searchRadius],
    queryFn: async () => {
      if (!coordinates) return [];
      return searchPharmacies(coordinates.lat, coordinates.lon, searchRadius);
    },
    enabled: !!coordinates,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return { pharmacies, isLoading };
};