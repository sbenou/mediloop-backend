import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import CitySearch from "@/components/CitySearch";
import { searchDoctors } from "@/lib/overpass";
import DoctorList from "./doctor/DoctorList";

interface Doctor {
  id: string;
  full_name: string;
  city: string;
  license_number: string;
  source?: 'database' | 'overpass';
}

const DoctorSearch = () => {
  const [searchCity, setSearchCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000); // Start with 2km radius

  // Fetch user's default address
  const { data: userAddress } = useQuery({
    queryKey: ['userAddress'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_default', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Auto-search based on user's address
  useEffect(() => {
    if (userAddress?.city) {
      handleCitySearch(userAddress.city);
    }
  }, [userAddress]);

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
      } else {
        toast({
          variant: "destructive",
          title: "Location not found",
          description: "Could not find coordinates for the specified city.",
        });
      }
    } catch (error) {
      console.error('Error searching city:', error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Failed to search for doctors. Please try again.",
      });
    }
  };

  const { data: locationData, isLoading: isLoadingLocation } = useQuery({
    queryKey: ["cityLocation", searchCity],
    queryFn: async () => {
      if (!searchCity) return null;
      return handleCitySearch(searchCity);
    },
    enabled: searchCity.length > 0,
  });

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["doctors", coordinates, searchRadius],
    queryFn: async () => {
      if (!coordinates) return [];
      
      // Get doctors from Overpass API with current radius
      const overpassDoctors = await searchDoctors(
        parseFloat(coordinates.lat),
        parseFloat(coordinates.lon),
        searchRadius
      );

      // If no results and radius can be increased
      if (overpassDoctors.length === 0 && searchRadius < 10000) {
        setSearchRadius(prev => Math.min(prev * 2, 10000));
        return [];
      }

      // Add source field to Overpass results
      const formattedOverpassDoctors = overpassDoctors.map(doc => ({
        ...doc,
        source: 'overpass' as const
      }));

      // Get doctors from database
      const { data: dbDoctors, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, license_number")
        .eq("role", "doctor")
        .ilike("city", `%${searchCity}%`);

      if (error) throw error;

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
    },
    enabled: !!coordinates,
  });

  const sendConnectionRequest = async (doctorId: string, source: 'database' | 'overpass') => {
    try {
      // Only send connection request for database doctors
      if (source === 'overpass') {
        toast({
          title: "Information",
          description: "Connection requests are only available for registered doctors.",
        });
        return;
      }

      const { error } = await supabase.rpc("handle_connection_request", {
        doctor_id: doctorId,
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Connection Request Sent",
        description: "The doctor will be notified of your request.",
      });
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send connection request. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <CitySearch onSearch={setSearchCity} />
      <DoctorList
        doctors={doctors}
        isLoading={isLoadingLocation || isLoadingDoctors}
        onConnect={sendConnectionRequest}
        searchCity={searchCity}
      />
    </div>
  );
};

export default DoctorSearch;