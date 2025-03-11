
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { getMapboxToken } from "@/services/address-service";

export const useLocationSearch = () => {
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000);
  const [isSearching, setIsSearching] = useState(false);

  const getCoordinates = async (query: string): Promise<{ lat: string; lon: string } | null> => {
    if (!query) return null;
    
    try {
      const mapboxToken = await getMapboxToken();
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        // Cache the results
        sessionStorage.setItem(`coords-${query}`, JSON.stringify({ lat: String(lat), lon: String(lng) }));
        return { lat: String(lat), lon: String(lng) };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
    }
  };

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

  return {
    coordinates,
    searchRadius,
    setSearchRadius,
    handleCitySearch,
    isSearching
  };
};
