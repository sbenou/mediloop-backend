
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
      if (!coordinates?.lat || !coordinates?.lon) return [];
      
      console.log('Fetching doctors with coordinates:', coordinates);
      
      // Get doctors from Overpass API with current radius
      const overpassDoctors = await searchDoctors(
        parseFloat(coordinates.lat),
        parseFloat(coordinates.lon),
        searchRadius
      );

      // Add source field to Overpass results
      const formattedOverpassDoctors = overpassDoctors.map(doc => ({
        ...doc,
        source: 'overpass' as const,
        coordinates: {
          lat: doc.coordinates?.lat || 0,
          lon: doc.coordinates?.lon || 0
        }
      }));

      // Get doctors from database
      const { data: dbDoctors, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, license_number")
        .eq("role", "doctor");

      if (error) {
        console.error('Error fetching doctors from database:', error);
        return formattedOverpassDoctors; // Return Overpass results even if DB fails
      }

      console.log('Database doctors:', dbDoctors);

      // Add source field to database results
      const formattedDbDoctors = (dbDoctors || []).map(doc => ({
        ...doc,
        source: 'database' as const,
        coordinates: coordinates // Use search coordinates as fallback
      }));

      // Combine and deduplicate results
      const allDoctors = [
        ...formattedDbDoctors,
        ...formattedOverpassDoctors
      ];

      // Remove duplicates based on id
      return Array.from(new Map(allDoctors.map(item => [item.id, item])).values());
    },
    enabled: !!coordinates?.lat && !!coordinates?.lon,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return { doctors: doctors || [], isLoading };
};
