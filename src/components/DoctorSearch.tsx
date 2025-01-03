import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import CitySearch from "@/components/CitySearch";
import DoctorList from "./doctor/DoctorList";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useDoctorSearch } from "@/hooks/useDoctorSearch";

const DoctorSearch = () => {
  const [searchCity, setSearchCity] = useState("");
  const { coordinates, searchRadius, setSearchRadius, handleCitySearch } = useLocationSearch();
  const { doctors, isLoading: isLoadingDoctors } = useDoctorSearch(coordinates, searchRadius);

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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Auto-search based on user's address
  useEffect(() => {
    if (userAddress?.city) {
      handleCitySearch(userAddress.city);
    }
  }, [userAddress]);

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

  // Check if we need to increase radius when no doctors are found
  useEffect(() => {
    if (doctors?.length === 0 && searchRadius < 10000) {
      setSearchRadius(prev => Math.min(prev * 2, 10000));
    }
  }, [doctors, searchRadius]);

  return (
    <div className="space-y-6">
      <CitySearch onSearch={setSearchCity} />
      <DoctorList
        doctors={doctors}
        isLoading={isLoadingDoctors}
        onConnect={sendConnectionRequest}
        searchCity={searchCity}
      />
    </div>
  );
};

export default DoctorSearch;