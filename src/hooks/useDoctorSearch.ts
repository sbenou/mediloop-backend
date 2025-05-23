
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { searchDoctors } from "@/lib/overpass";
import { useRecoilValue } from 'recoil';
import { selectedCountryState } from '@/store/location/atoms';

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  source?: 'database' | 'overpass';
  coordinates?: { lat: number; lon: number } | null;
}

export const useDoctorSearch = (
  coordinates: { lat: number; lon: number } | null,
  searchRadius: number
) => {
  const selectedCountry = useRecoilValue(selectedCountryState);
  
  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors", coordinates?.lat, coordinates?.lon, searchRadius, selectedCountry],
    queryFn: async () => {
      // For country-based search when coordinates aren't available
      if (!coordinates && selectedCountry) {
        console.log(`Searching for doctors in country: ${selectedCountry} without coordinates`);
        
        try {
          // Get doctors from database first
          const { data: dbDoctors, error } = await supabase
            .from("profiles")
            .select("id, full_name, city, license_number, coordinates")
            .eq("role", "doctor");

          if (error) {
            console.error('Error fetching doctors from database:', error);
            throw error;
          }

          console.log('Database doctors:', dbDoctors?.length || 0);

          // Add source field to database results, handle null cities
          const formattedDbDoctors = Array.isArray(dbDoctors) 
            ? dbDoctors.map(doc => ({
                ...doc,
                source: 'database' as const,
                city: doc.city || 'Unknown location',  // Ensure city is never null
                coordinates: doc.coordinates || null
              }))
            : [];

          // Get doctors from Overpass API with country code only
          let formattedOverpassDoctors = [];
          try {
            const countryCode = selectedCountry || 'LU';
            console.log(`Searching for doctors in country: ${countryCode} (country-only search)`);
            
            const overpassDoctors = await searchDoctors(
              null, // No lat
              null, // No lon
              0,    // No radius needed
              countryCode
            );
            
            if (!Array.isArray(overpassDoctors)) {
              console.error('Invalid response from searchDoctors:', overpassDoctors);
              return formattedDbDoctors; // Return just database doctors
            }

            // Add source field to Overpass results
            formattedOverpassDoctors = overpassDoctors
              .filter(doc => doc && typeof doc === 'object')
              .map(doc => ({
                ...doc,
                city: doc.city || 'Unknown location',  // Ensure city is never null
                source: 'overpass' as const
              }));

            console.log('Overpass doctors found:', formattedOverpassDoctors.length);
          } catch (overpassError) {
            console.error("Error fetching overpass doctors:", overpassError);
            // Just continue with database doctors
            return formattedDbDoctors;
          }

          // Combine and deduplicate results
          const allDoctors = [...formattedDbDoctors, ...formattedOverpassDoctors];
          
          // Remove duplicates based on id
          const doctorMap = new Map();
          allDoctors.forEach(item => {
            if (item && item.id) {
              doctorMap.set(item.id, item);
            }
          });
          
          const result = Array.from(doctorMap.values());
          console.log('Final doctor count (country-only search):', result.length);
          return result;
        } catch (err) {
          console.error("Error in useDoctorSearch (country-only search):", err);
          return [];
        }
      }
      
      // Coordinate-based search (for logged-in users with location)
      if (coordinates) {
        console.log('Fetching doctors with coordinates:', coordinates, 'radius:', searchRadius, 'country:', selectedCountry);
      
        try {
          // Get doctors from database first
          const { data: dbDoctors, error } = await supabase
            .from("profiles")
            .select("id, full_name, city, license_number, coordinates")
            .eq("role", "doctor");

          if (error) {
            console.error('Error fetching doctors from database:', error);
            throw error;
          }

          console.log('Database doctors:', dbDoctors?.length || 0);

          // Add source field to database results, handle null cities
          const formattedDbDoctors = Array.isArray(dbDoctors) 
            ? dbDoctors.map(doc => ({
                ...doc,
                source: 'database' as const,
                city: doc.city || 'Unknown location',  // Ensure city is never null
                coordinates: doc.coordinates || null
              }))
            : [];

          // If there are no valid coordinates, just return the database doctors
          if (!coordinates.lat || !coordinates.lon || 
              isNaN(coordinates.lat) || isNaN(coordinates.lon)) {
            console.log('Invalid coordinates, skipping overpass search');
            return formattedDbDoctors;
          }

          // Get doctors from Overpass API with current radius and country code
          let formattedOverpassDoctors = [];
          try {
            const countryCode = selectedCountry || 'LU';
            console.log(`Searching for doctors in country: ${countryCode} with radius: ${searchRadius}`);
            
            const overpassDoctors = await searchDoctors(
              coordinates.lat,
              coordinates.lon,
              searchRadius,
              countryCode
            );
            
            // Handle unexpected response format safely
            if (!Array.isArray(overpassDoctors)) {
              console.error('Invalid response from searchDoctors:', overpassDoctors);
              return formattedDbDoctors; // Return just database doctors
            }

            // Add source field to Overpass results
            formattedOverpassDoctors = overpassDoctors
              .filter(doc => doc && typeof doc === 'object')
              .map(doc => ({
                ...doc,
                city: doc.city || 'Unknown location',  // Ensure city is never null
                source: 'overpass' as const
              }));

            console.log('Overpass doctors found:', formattedOverpassDoctors.length);
          } catch (overpassError) {
            console.error("Error fetching overpass doctors:", overpassError);
            // Just continue with database doctors
            return formattedDbDoctors;
          }

          // Combine all doctors
          const allDoctors = [];
          
          // Add database doctors first
          if (Array.isArray(formattedDbDoctors)) {
            formattedDbDoctors.forEach(doc => {
              if (doc && doc.id) {
                allDoctors.push(doc);
              }
            });
          }
          
          // Then add overpass doctors
          if (Array.isArray(formattedOverpassDoctors)) {
            formattedOverpassDoctors.forEach(doc => {
              if (doc && doc.id) {
                allDoctors.push(doc);
              }
            });
          }
          
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
      }
      
      // Fallback if neither coordinates nor country are available
      console.log('No coordinates or country provided for doctor search');
      return [];
    },
    // Query configuration
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 1, // Limit retries
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false, // Disable automatic refetching
    enabled: Boolean(coordinates) || Boolean(selectedCountry), // Run when we have coordinates OR a selected country
  });

  return { 
    doctors: Array.isArray(doctors) ? doctors : [], 
    isLoading 
  };
};
