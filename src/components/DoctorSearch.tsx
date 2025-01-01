import { useState } from "react";
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
}

const DoctorSearch = () => {
  const [searchCity, setSearchCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);

  const { data: locationData, isLoading: isLoadingLocation } = useQuery({
    queryKey: ["cityLocation", searchCity],
    queryFn: async () => {
      if (!searchCity) return null;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchCity
        )}&limit=1`
      );
      const data = await response.json();
      if (data.length > 0) {
        setCoordinates({ lat: data[0].lat, lon: data[0].lon });
        return data[0];
      }
      return null;
    },
    enabled: searchCity.length > 0,
  });

  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["doctors", coordinates],
    queryFn: async () => {
      if (!coordinates) return [];
      
      // Get doctors from Overpass API
      const overpassDoctors = await searchDoctors(
        parseFloat(coordinates.lat),
        parseFloat(coordinates.lon)
      );

      // Get doctors from database
      const { data: dbDoctors, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, license_number")
        .eq("role", "doctor")
        .ilike("city", `%${searchCity}%`);

      if (error) throw error;

      // Combine and deduplicate results
      const allDoctors = [
        ...(dbDoctors || []),
        ...overpassDoctors
      ];

      // Remove duplicates based on id
      return Array.from(new Map(allDoctors.map(item => [item.id, item])).values());
    },
    enabled: !!coordinates,
  });

  const sendConnectionRequest = async (doctorId: string) => {
    try {
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