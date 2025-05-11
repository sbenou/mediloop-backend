
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
      if (!coordinates) {
        console.log('No coordinates provided for doctor search');
        return [];
      }
      
      console.log('Fetching doctors with coordinates:', coordinates, 'radius:', searchRadius);
      
      try {
        // Get doctors from database first
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
        const formattedDbDoctors = Array.isArray(dbDoctors) 
          ? dbDoctors.map(doc => ({
              ...doc,
              source: 'database' as const
            }))
          : [];

        // If there are no valid coordinates, just return the database doctors
        if (!coordinates.lat || !coordinates.lon || 
            isNaN(parseFloat(coordinates.lat)) || isNaN(parseFloat(coordinates.lon))) {
          console.log('Invalid coordinates, skipping overpass search');
          return formattedDbDoctors;
        }

        // Get doctors from Overpass API with current radius
        const overpassDoctors = await searchDoctors(
          parseFloat(coordinates.lat),
          parseFloat(coordinates.lon),
          searchRadius
        );

        if (!Array.isArray(overpassDoctors)) {
          console.error('Invalid response from searchDoctors:', overpassDoctors);
          return formattedDbDoctors; // Return just database doctors
        }

        // Add source field to Overpass results
        const formattedOverpassDoctors = overpassDoctors
          .filter(doc => doc && typeof doc === 'object')
          .map(doc => ({
            ...doc,
            source: 'overpass' as const
          }));

        console.log('Overpass doctors found:', formattedOverpassDoctors.length);

        // Combine and deduplicate results
        const allDoctors = [
          ...formattedDbDoctors,
          ...formattedOverpassDoctors
        ].filter(Boolean);

        // Remove duplicates based on id
        const doctorMap = new Map();
        allDoctors.forEach(item => {
          if (item && item.id) {
            doctorMap.set(item.id, item);
          }
        });
        
        const result = Array.from(doctorMap.values());
        console.log('Final doctor count:', result.length);
        return result;
      } catch (err) {
        console.error("Error in useDoctorSearch:", err);
        return [];
      }
    },
    enabled: true, // Always run query, even with null coordinates
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return { 
    doctors: Array.isArray(doctors) ? doctors : [], 
    isLoading 
  };
};
