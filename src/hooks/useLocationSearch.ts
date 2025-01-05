import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { getCoordinates } from "@/services/geocoding";

export const useLocationSearch = () => {
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [isSearching, setIsSearching] = useState(false);

  const handleCitySearch = async (city: string) => {
    if (!city || isSearching) return false;

    setIsSearching(true);
    try {
      const coords = await getCoordinates(city);
      
      if (coords) {
        setCoordinates(coords);
        setSearchRadius(2000); // Reset radius on new search
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find coordinates for the specified city. Please try another city name.",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error searching city:', error);
      
      // Only show toast for non-network errors
      if (!error.message?.includes('NetworkError')) {
        toast({
          variant: "destructive",
          title: "Search Error",
          description: "Failed to search location. Please try again in a few moments.",
        });
      }
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  return {
    coordinates,
    searchRadius,
    setSearchRadius,
    handleCitySearch,
    isSearching
  };
};