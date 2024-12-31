import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import CitySearch from "@/components/CitySearch";

interface Doctor {
  id: string;
  full_name: string;
  city: string;
  license_number: string;
}

const DoctorSearch = () => {
  const [searchCity, setSearchCity] = useState("");

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors", searchCity],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, license_number")
        .eq("role", "doctor")
        .ilike("city", `%${searchCity}%`);

      if (error) throw error;
      return data as Doctor[];
    },
    enabled: searchCity.length > 0,
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

      {isLoading && <p className="text-center text-gray-500">Searching for doctors...</p>}

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

      {doctors?.length === 0 && searchCity && (
        <p className="text-center text-gray-500">No doctors found in {searchCity}</p>
      )}
    </div>
  );
};

export default DoctorSearch;