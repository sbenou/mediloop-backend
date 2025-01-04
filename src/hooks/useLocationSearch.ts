import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { getCoordinates } from "@/services/geocoding";

export const useLocationSearch = () => {
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000); // Start with 2km radius

  const handleCitySearch = async (city: string) => {
    if (!city) return false;

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
      
      let errorMessage = "Failed to search for location. ";
      if (error.name === 'AbortError') {
        errorMessage += "Request timed out. Please try again.";
      } else if (!navigator.onLine) {
        errorMessage += "Please check your internet connection.";
      } else {
        errorMessage += "Please try again in a few moments.";
      }

      toast({
        variant: "destructive",
        title: "Search Error",
        description: errorMessage,
      });
      return false;
    }
  };

  return {
    coordinates,
    searchRadius,
    setSearchRadius,
    handleCitySearch
  };
};