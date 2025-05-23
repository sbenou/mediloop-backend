import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchDoctors } from "@/lib/overpass";
import { supabase } from '@/lib/supabase';
import { useRecoilValue } from 'recoil';
import { selectedCountryState } from '@/store/location/atoms';
import type { Doctor } from '@/lib/types/overpass.types';

export const useDoctorFinder = (
  userLocation: { lat: number; lon: number } | null
) => {
  const selectedCountry = useRecoilValue(selectedCountryState);
  const [searchQuery, setSearchQuery] = useState("");
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5000);

  // Fetch doctors data
  const { data: doctors, isLoading, error } = useQuery({
    queryKey: ["doctors-finder", userLocation?.lat, userLocation?.lon, searchRadius, selectedCountry],
    queryFn: async () => {
      try {
        console.log('Fetching doctors with params:', {
          userLocation,
          searchRadius,
          selectedCountry
        });

        // Get database doctors first
        const { data: dbDoctors, error: dbError } = await supabase
          .from("profiles")
          .select("id, full_name, city, license_number, email, phone, hours")
          .eq("role", "doctor");
          
        if (dbError) {
          console.error('Error fetching doctors from database:', dbError);
        }

        console.log('Database doctors:', dbDoctors?.length || 0);
        
        // Format database doctors
        const formattedDbDoctors: Doctor[] = dbDoctors?.map(doctor => ({
          id: doctor.id,
          full_name: doctor.full_name || 'Unknown Doctor',
          city: doctor.city || 'Unknown location',
          license_number: doctor.license_number || 'Not specified',
          email: doctor.email,
          phone: doctor.phone,
          hours: doctor.hours,
          source: 'database' as const,
          coordinates: null
        })) || [];

        // Get doctors from Overpass API based on location
        const overpassDoctors = userLocation 
          ? await searchDoctors(
              userLocation.lat,
              userLocation.lon,
              searchRadius,
              selectedCountry || 'LU'
            )
          : await searchDoctors(null, null, 0, selectedCountry || 'LU');
            
        console.log('Overpass doctors:', overpassDoctors?.length || 0);
        
        // Combine both sources
        const allDoctors = [...formattedDbDoctors, ...overpassDoctors] as Doctor[];
        console.log('Combined doctors count:', allDoctors.length);
        
        return allDoctors;
      } catch (err) {
        console.error("Error in useDoctorFinder:", err);
        return [] as Doctor[];
      }
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Apply filters for doctors search
  const filteredDoctors = useMemo(() => {
    if (!doctors) return [] as Doctor[];
    
    let filtered = [...doctors];
    
    // Apply search filter if search query is provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => {
        return (
          doctor.full_name?.toLowerCase().includes(query) ||
          doctor.city?.toLowerCase().includes(query) ||
          doctor.license_number?.toLowerCase().includes(query)
        );
      });
    }
    
    // Apply location-based filter if enabled and user location is available
    if (useLocationFilter && userLocation) {
      // Use doctors that have distance property or are within radius
      filtered = filtered.filter(doctor => {
        // If doctor has a distance property, it's already filtered by location
        if (doctor.distance !== undefined) {
          return true;
        }
        
        // Otherwise, include based on user preference
        return true; // Include all when location filter is enabled but no distance available
      });
    }
    
    return filtered;
  }, [doctors, searchQuery, useLocationFilter, userLocation]);

  // Adjust radius if no results
  useEffect(() => {
    if (filteredDoctors.length === 0 && isLoading === false && searchRadius < 20000) {
      setSearchRadius(prev => Math.min(prev + 5000, 20000));
    }
  }, [filteredDoctors.length, isLoading, searchRadius]);

  return { 
    doctors: Array.isArray(doctors) ? doctors : [] as Doctor[], 
    filteredDoctors,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    useLocationFilter,
    setUseLocationFilter,
    searchRadius,
    setSearchRadius
  };
};
