import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export const useLocationSearch = () => {
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000); // Start with 2km radius

  const handleCitySearch = async (city: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
      );
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
          description: "Could not find coordinates for the specified city.",
        });
        return false;
      }
    } catch (error) {
      console.error('Error searching city:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for location. Please try again.",
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