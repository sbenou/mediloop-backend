
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
      console.log(`🔍 Starting doctor search with coordinates: ${JSON.stringify(coordinates)}, radius: ${searchRadius}, country: ${selectedCountry}`);
      
      try {
        // Get doctors from database with a simpler query first
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
          console.error('❌ Error fetching doctors from database:', error);
          // Don't throw here, continue with overpass data
        }

        console.log(`📊 Database doctors found: ${dbDoctors?.length || 0}`);
        
        // Debug each database doctor
        if (dbDoctors) {
          dbDoctors.forEach((doc, index) => {
            console.log(`👨‍⚕️ DB Doctor ${index + 1}:`, {
              id: doc.id,
              name: doc.full_name,
              city: doc.city,
              license: doc.license_number
            });
          });
        }

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
              
              console.log(`🏥 Metadata for doctor ${doc.full_name}:`, metadata);
            } catch (metaError) {
              console.error(`❌ Error fetching metadata for doctor: ${doc.id}`, metaError);
            }

            const formattedDoctor = {
              id: doc.id,
              full_name: doc.full_name || 'Doctor',
              city: doc.city || metadata?.city || 'Unknown location',
              license_number: doc.license_number || '',
              email: doc.email,
              phone: null,
              hours: metadata?.hours || null,
              address: metadata?.address || '',
              source: 'database' as const,
              coordinates: null, // Database doctors don't have coordinates yet
              distance: undefined
            };
            
            console.log(`✅ Formatted DB doctor:`, formattedDoctor);
            formattedDbDoctors.push(formattedDoctor);
          }
        }

        // Get doctors from Overpass API
        let formattedOverpassDoctors = [];
        try {
          const countryCode = selectedCountry || 'LU';
          console.log(`🌍 Searching Overpass API with country: ${countryCode}`);
          
          const overpassDoctors = coordinates 
            ? await searchDoctors(
                coordinates.lat,
                coordinates.lon,
                searchRadius * 2, // Increase search radius for more results
                countryCode
              )
            : await searchDoctors(null, null, 0, countryCode);
          
          if (!Array.isArray(overpassDoctors)) {
            console.error('❌ Invalid response from searchDoctors:', overpassDoctors);
          } else {
            console.log(`🗺️ Overpass doctors found: ${overpassDoctors.length}`);
            
            // Debug each overpass doctor
            overpassDoctors.forEach((doc, index) => {
              console.log(`👨‍⚕️ Overpass Doctor ${index + 1}:`, {
                id: doc.id,
                name: doc.full_name,
                coordinates: doc.coordinates,
                address: doc.address,
                city: doc.city
              });
            });

            // Format Overpass results and calculate distances
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
                
                const formattedDoc = {
                  ...doc,
                  city: doc.city || doc.address || 'Unknown location',
                  source: 'overpass' as const,
                  distance
                };
                
                console.log(`✅ Formatted Overpass doctor:`, formattedDoc);
                return formattedDoc;
              });

            console.log(`📍 Overpass doctors with coordinates: ${formattedOverpassDoctors.filter(d => d.coordinates?.lat && d.coordinates?.lon).length}`);
          }
        } catch (overpassError) {
          console.error("❌ Error fetching overpass doctors:", overpassError);
          // Continue with database doctors only
        }

        // Combine all doctors
        const allDoctors = [...formattedDbDoctors, ...formattedOverpassDoctors];
        console.log(`🔗 Total doctors before deduplication: ${allDoctors.length}`);
        
        // Remove duplicates based on id and sort by distance if available
        const doctorMap = new Map();
        allDoctors.forEach(item => {
          if (item && item.id) {
            doctorMap.set(item.id, item);
          }
        });
        
        let result = Array.from(doctorMap.values());
        console.log(`📋 Final doctors after deduplication: ${result.length}`);
        
        // Count doctors with coordinates
        const doctorsWithCoords = result.filter(d => d.coordinates?.lat && d.coordinates?.lon);
        console.log(`📍 Doctors with valid coordinates: ${doctorsWithCoords.length}`);
        
        // Sort by distance if coordinates are available
        if (coordinates) {
          result = result.sort((a, b) => {
            if (a.distance === undefined && b.distance === undefined) return 0;
            if (a.distance === undefined) return 1;
            if (b.distance === undefined) return -1;
            return a.distance - b.distance;
          });
        }
        
        console.log(`✅ Final doctor search result: ${result.length} doctors`);
        return result;
      } catch (err) {
        console.error("❌ Error in useDoctorSearch:", err);
        return [];
      }
    },
    // Query configuration
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2, // Increase retries
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
  });

  return { 
    doctors: Array.isArray(doctors) ? doctors : [], 
    isLoading,
    error
  };
};
