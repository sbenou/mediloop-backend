
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
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  distance?: number;
  source?: 'database' | 'overpass';
  coordinates?: { lat: number; lon: number } | null;
  address?: string;
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 'Invalid coordinates';
  }
  
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export const useDoctorSearch = (
  coordinates: { lat: number; lon: number } | null,
  searchRadius: number
) => {
  const selectedCountry = useRecoilValue(selectedCountryState);
  
  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ["doctors", coordinates?.lat, coordinates?.lon, searchRadius, selectedCountry],
    queryFn: async () => {
      console.log(`Starting doctor search with coordinates: ${JSON.stringify(coordinates)}, radius: ${searchRadius}, country: ${selectedCountry}`);
      
      // For country-based search when coordinates aren't available
      if (!coordinates && selectedCountry) {
        console.log(`Searching for doctors in country: ${selectedCountry} without coordinates`);
        
        try {
          // Get doctors from database with simpler query first
          const { data: dbDoctors, error } = await supabase
            .from("profiles")
            .select(`
              id, 
              full_name, 
              city, 
              license_number, 
              email
            `)
            .eq("role", "doctor");

          if (error) {
            console.error('Error fetching doctors from database:', error);
            throw error;
          }

          console.log('Database doctors:', dbDoctors?.length || 0);

          // Get metadata separately for each doctor
          const formattedDbDoctors = [];
          if (Array.isArray(dbDoctors)) {
            for (const doc of dbDoctors) {
              let metadata = null;
              try {
                const { data: metaData } = await supabase
                  .from("doctor_metadata")
                  .select("hours, address, city, postal_code")
                  .eq("doctor_id", doc.id)
                  .maybeSingle();
                metadata = metaData;
              } catch (metaError) {
                console.error('Error fetching metadata for doctor:', doc.id, metaError);
              }

              formattedDbDoctors.push({
                id: doc.id,
                full_name: doc.full_name || 'Doctor',
                city: doc.city || metadata?.city || 'Unknown location',
                license_number: doc.license_number || '',
                email: doc.email,
                phone: null,
                hours: metadata?.hours || null,
                address: metadata?.address || '',
                source: 'database' as const,
                coordinates: null
              });
            }
          }

          // Get doctors from Overpass API with country code only
          let formattedOverpassDoctors = [];
          try {
            const countryCode = selectedCountry || 'LU';
            console.log(`Searching for doctors in country: ${countryCode} (country-only search)`);
            
            const overpassDoctors = await searchDoctors(
              null, // No lat
              null, // No lon
              0,    // No radius needed for country search
              countryCode
            );
            
            if (!Array.isArray(overpassDoctors)) {
              console.error('Invalid response from searchDoctors:', overpassDoctors);
              return formattedDbDoctors; // Return just database doctors
            }

            console.log('Raw Overpass results:', overpassDoctors.length);

            // Add source field to Overpass results
            formattedOverpassDoctors = overpassDoctors
              .filter(doc => doc && typeof doc === 'object')
              .map(doc => ({
                ...doc,
                city: doc.city || 'Unknown location',
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
          // Get doctors from database with simpler query first
          const { data: dbDoctors, error } = await supabase
            .from("profiles")
            .select(`
              id, 
              full_name, 
              city, 
              license_number, 
              email
            `)
            .eq("role", "doctor");

          if (error) {
            console.error('Error fetching doctors from database:', error);
            throw error;
          }

          console.log('Database doctors:', dbDoctors?.length || 0);

          // Get metadata separately for each doctor
          const formattedDbDoctors = [];
          if (Array.isArray(dbDoctors)) {
            for (const doc of dbDoctors) {
              let metadata = null;
              try {
                const { data: metaData } = await supabase
                  .from("doctor_metadata")
                  .select("hours, address, city, postal_code")
                  .eq("doctor_id", doc.id)
                  .maybeSingle();
                metadata = metaData;
              } catch (metaError) {
                console.error('Error fetching metadata for doctor:', doc.id, metaError);
              }

              formattedDbDoctors.push({
                id: doc.id,
                full_name: doc.full_name || 'Doctor',
                city: doc.city || metadata?.city || 'Unknown location',
                license_number: doc.license_number || '',
                email: doc.email,
                phone: null,
                hours: metadata?.hours || null,
                address: metadata?.address || '',
                source: 'database' as const,
                coordinates: null,
                distance: undefined
              });
            }
          }

          // Get doctors from Overpass API with current radius and country code
          let formattedOverpassDoctors = [];
          try {
            const countryCode = selectedCountry || 'LU';
            console.log(`Searching for doctors with coordinates in country: ${countryCode} with radius: ${searchRadius}`);
            
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

            console.log('Raw Overpass results:', overpassDoctors.length);

            // Add source field to Overpass results and calculate distances
            formattedOverpassDoctors = overpassDoctors
              .filter(doc => doc && typeof doc === 'object')
              .map(doc => {
                let distance = undefined;
                if (doc.coordinates?.lat && doc.coordinates?.lon && coordinates) {
                  const docLat = parseFloat(String(doc.coordinates.lat));
                  const docLon = parseFloat(String(doc.coordinates.lon));
                  
                  if (!isNaN(docLat) && !isNaN(docLon)) {
                    const calculatedDist = calculateDistance(
                      coordinates.lat,
                      coordinates.lon,
                      docLat,
                      docLon
                    );
                    
                    if (typeof calculatedDist === 'number') {
                      distance = parseFloat(calculatedDist.toFixed(1));
                    }
                  }
                }
                
                return {
                  ...doc,
                  city: doc.city || 'Unknown location',
                  source: 'overpass' as const,
                  distance
                };
              });

            console.log('Overpass doctors found:', formattedOverpassDoctors.length);
          } catch (overpassError) {
            console.error("Error fetching overpass doctors:", overpassError);
            // Just continue with database doctors
            return formattedDbDoctors;
          }

          // Combine all doctors
          const allDoctors = [...formattedDbDoctors, ...formattedOverpassDoctors];
          
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
      
      // Fallback to just a country search if nothing else works
      try {
        console.log('Falling back to country-only search with country code:', selectedCountry || 'LU');
        const countryDoctors = await searchDoctors(null, null, 0, selectedCountry || 'LU');
        console.log('Fallback search found:', countryDoctors?.length || 0, 'doctors');
        return countryDoctors;
      } catch (fallbackErr) {
        console.error("Error in fallback doctor search:", fallbackErr);
        return [];
      }
    },
    // Query configuration
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 1, // Limit retries
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false, // Disable automatic refetching
  });

  return { 
    doctors: Array.isArray(doctors) ? doctors : [], 
    isLoading,
    error
  };
};
