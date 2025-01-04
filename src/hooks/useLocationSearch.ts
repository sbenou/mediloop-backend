import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export const useLocationSearch = () => {
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000); // Start with 2km radius

  const handleCitySearch = async (city: string) => {
    if (!city) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Lovable Health App', // Nominatim requires a User-Agent
            'Accept-Language': 'en' // Prefer English results
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.length > 0) {
        setCoordinates({
          lat: data[0].lat,
          lon: data[0].lon
        });
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