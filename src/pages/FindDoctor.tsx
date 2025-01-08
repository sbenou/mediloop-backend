import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { useDoctorSearch } from "@/hooks/useDoctorSearch";
import Header from "@/components/layout/Header";
import CitySearch from "@/components/CitySearch";
import DoctorList from "@/components/doctor/DoctorList";
import { toast } from "@/components/ui/use-toast";

const LUXEMBOURG_COORDINATES = {
  lat: "49.6116",
  lon: "6.1319"
};

const FindDoctor = () => {
  const navigate = useNavigate();
  const { coordinates, searchRadius, setSearchRadius, handleCitySearch, isSearching } = useLocationSearch();
  
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Convert coordinates to string format before passing them
  const searchCoordinates = coordinates 
    ? { 
        lat: coordinates.lat.toString(), 
        lon: coordinates.lon.toString() 
      } 
    : LUXEMBOURG_COORDINATES;

  const { doctors, isLoading } = useDoctorSearch(searchCoordinates, searchRadius);

  useEffect(() => {
    if (!session && !coordinates) {
      // For non-logged in users, show all doctors in Luxembourg City by default
      handleCitySearch("Luxembourg City");
    } else if (session && userProfile?.city) {
      // For logged-in users, show nearby doctors based on their city
      handleCitySearch(userProfile.city);
    }
  }, [session, userProfile?.city]);

  useEffect(() => {
    if (session && doctors?.length === 0 && searchRadius < 10000) {
      // Increase search radius if no doctors found (for logged-in users)
      setSearchRadius(prev => Math.min(prev + 2000, 10000));
    }
  }, [doctors?.length, searchRadius, session]);

  const handleConnect = async (doctorId: string, source: 'database' | 'overpass') => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please login to connect with doctors.",
      });
      navigate('/login', { state: { returnTo: '/find-doctor' } });
      return;
    }

    try {
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
    <div className="min-h-screen bg-background">
      <Header session={session} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Find a Doctor Near You</h1>
          <div className="mb-8">
            <CitySearch onSearch={handleCitySearch} />
          </div>
          <DoctorList
            doctors={doctors}
            isLoading={isLoading || isSearching}
            onConnect={handleConnect}
            searchCity={coordinates ? coordinates.lat : ''}
          />
        </div>
      </main>
    </div>
  );
};

export default FindDoctor;