
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { searchDoctors } from "@/lib/overpass";

interface Doctor {
  id: string;
  full_name: string;
  city: string;
  license_number: string;
  source?: 'database' | 'overpass';
}

export const useDoctorSearch = (
  coordinates: { lat: string; lon: string } | null,
  searchRadius: number
) => {
  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors", coordinates?.lat, coordinates?.lon, searchRadius],
    queryFn: async () => {
      if (!coordinates) return [];
      
      console.log('Fetching doctors with coordinates:', coordinates);
      
      try {
        // Get doctors from Overpass API with current radius
        const overpassDoctors = await searchDoctors(
          parseFloat(coordinates.lat),
          parseFloat(coordinates.lon),
          searchRadius
        );

        // Add source field to Overpass results
        const formattedOverpassDoctors = overpassDoctors.map(doc => ({
          ...doc,
          source: 'overpass' as const
        }));

        // Get doctors from database
        const { data: dbDoctors, error } = await supabase
          .from("profiles")
          .select("id, full_name, city, license_number")
          .eq("role", "doctor");

        if (error) {
          console.error('Error fetching doctors from database:', error);
          throw error;
        }

        console.log('Database doctors:', dbDoctors);

        // Add source field to database results
        const formattedDbDoctors = (dbDoctors || []).map(doc => ({
          ...doc,
          source: 'database' as const
        }));

        // Combine and deduplicate results
        const allDoctors = [
          ...formattedDbDoctors,
          ...formattedOverpassDoctors
        ];

        // Remove duplicates based on id
        return Array.from(new Map(allDoctors.map(item => [item.id, item])).values());
      } catch (err) {
        console.error("Error in useDoctorSearch:", err);
        return [];
      }
    },
    enabled: !!coordinates,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return { 
    doctors: doctors || [], 
    isLoading 
  };
};
