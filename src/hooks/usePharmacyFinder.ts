
import { useState, useEffect, useCallback } from "react";
import { searchPharmacies } from "@/lib/overpass";
import { toast } from "@/components/ui/use-toast";
import type { Pharmacy } from "@/lib/types/overpass.types";

export const usePharmacyFinder = (
  coordinates: { lat: number; lon: number } | null
) => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [filteredPharmacies, setFilteredPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [useLocationFilter, setUseLocationFilter] = useState(false);

  // Fetch pharmacies when coordinates change
  useEffect(() => {
    if (!coordinates) return;
    
    const fetchPharmacies = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const results = await searchPharmacies(coordinates.lat, coordinates.lon, 5000);
        setPharmacies(results);
        setFilteredPharmacies(results);
      } catch (err) {
        console.error("Error fetching pharmacies:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch pharmacies"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPharmacies();
  }, [coordinates]);
  
  // Filter pharmacies based on search query and location filter
  useEffect(() => {
    if (!pharmacies.length) return;
    
    let filtered = [...pharmacies];
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(pharmacy => 
        pharmacy.name.toLowerCase().includes(query) || 
        pharmacy.address.toLowerCase().includes(query)
      );
    }
    
    // Apply location filter if enabled
    if (useLocationFilter && coordinates) {
      // Filter to pharmacies within 2km
      filtered = filtered.filter(pharmacy => {
        // Calculate if pharmacy is within 2km
        // This is a simple check - the actual distance is already in the pharmacy object
        const distance = pharmacy.distance;
        if (typeof distance === 'string') {
          const distanceNum = parseFloat(distance);
          return !isNaN(distanceNum) && distanceNum <= 2;
        }
        return false;
      });
      
      // Show toast notification about location filter
      toast({
        title: "Location filter applied",
        description: `Showing pharmacies within 2km of your location`,
      });
    }
    
    setFilteredPharmacies(filtered);
  }, [searchQuery, pharmacies, useLocationFilter, coordinates]);
  
  return {
    pharmacies,
    filteredPharmacies,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    useLocationFilter,
    setUseLocationFilter
  };
};
