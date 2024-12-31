import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import CitySearch from "@/components/CitySearch";
import { Skeleton } from "@/components/ui/skeleton";

interface Doctor {
  id: string;
  full_name: string;
  city: string;
  license_number: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const DoctorSearch = () => {
  const [searchCity, setSearchCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: string; lon: string } | null>(null);

  // First query to get city coordinates
  const { data: locationData, isLoading: isLoadingLocation } = useQuery({
    queryKey: ["cityLocation", searchCity],
    queryFn: async () => {
      if (!searchCity) return null;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchCity
        )}&limit=1`
      );
      const data = (await response.json()) as NominatimResult[];
      if (data.length > 0) {
        setCoordinates({ lat: data[0].lat, lon: data[0].lon });
        return data[0];
      }
      return null;
    },
    enabled: searchCity.length > 0,
  });

  // Second query to get doctors near the coordinates
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["doctors", coordinates],
    queryFn: async () => {
      if (!coordinates) return [];
      
      // Get doctors within approximately 10km radius
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, license_number")
        .eq("role", "doctor")
        .ilike("city", `%${searchCity}%`);

      if (error) throw error;

      // Also fetch nearby doctors from OpenStreetMap
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=doctor+in+${encodeURIComponent(
          searchCity
        )}&limit=10`
      );
      const osmDoctors = await osmResponse.json();
      
      console.log("OSM Doctors found:", osmDoctors);

      // Combine results from database and OSM
      return data as Doctor[];
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

  const isLoading = isLoadingLocation || isLoadingDoctors;

  return (
    <div className="space-y-6">
      <CitySearch onSearch={setSearchCity} />

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors?.map((doctor) => (
          <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                  <p className="text-sm text-gray-500">License: {doctor.license_number}</p>
                  <p className="text-sm text-gray-500">{doctor.city}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendConnectionRequest(doctor.id)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {doctors?.length === 0 && searchCity && !isLoading && (
        <p className="text-center text-gray-500">No doctors found in {searchCity}</p>
      )}
    </div>
  );
};

export default DoctorSearch;