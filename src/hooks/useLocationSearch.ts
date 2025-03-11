
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { getMapboxToken } from "@/services/address-service";
import { getCoordinates, searchAddress } from "@/services/geocoding";

export const useLocationSearch = () => {
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [isSearching, setIsSearching] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

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
        // Check if we have cached coordinates
        const cachedCoords = sessionStorage.getItem(`coords-${city}`);
        if (cachedCoords) {
          const parsedCoords = JSON.parse(cachedCoords);
          setCoordinates(parsedCoords);
          return true;
        }
        
        toast({
          title: "Location not found",
          description: "Using cached data if available. Please try another city name.",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error searching city:', error);
      
      // Check for cached data
      const cachedCoords = sessionStorage.getItem(`coords-${city}`);
      if (cachedCoords) {
        const parsedCoords = JSON.parse(cachedCoords);
        setCoordinates(parsedCoords);
        toast({
          title: "Using cached data",
          description: "Showing results from previous search.",
        });
        return true;
      }
      
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search location. Using cached data if available.",
      });
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  // Add method for searching addresses directly
  const handleAddressSearch = async (query: string) => {
    if (!query || query.length < 3 || isSearching) return;
    
    setIsSearching(true);
    try {
      const results = await searchAddress(query);
      setAddressSuggestions(results);
      return results;
    } catch (error) {
      console.error('Error searching addresses:', error);
      setAddressSuggestions([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  return {
    coordinates,
    searchRadius,
    setSearchRadius,
    handleCitySearch,
    handleAddressSearch,
    addressSuggestions,
    isSearching
  };
};
