
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SearchHeader from '@/components/pharmacy/SearchHeader';
import { useDoctorSearch } from '@/hooks/useDoctorSearch';
import { useAuth } from '@/hooks/auth/useAuth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DoctorListSection from '@/components/doctor/DoctorListSection';

const SearchDoctors = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  const { coordinates: locationCoordinates, handleCitySearch } = useLocationSearch();
  
  // Get default Luxembourg coordinates if location search hasn't provided any
  const { data: coordinates } = useQuery({
    queryKey: ['geo-coordinates'],
    queryFn: async () => {
      return locationCoordinates ? 
        { lat: parseFloat(locationCoordinates.lat), lon: parseFloat(locationCoordinates.lon) } : 
        { lat: 49.8153, lon: 6.1296 };
    },
    enabled: true,
  });
  
  const currentCoordinates = coordinates || { lat: 49.8153, lon: 6.1296 };
  
  const { doctors, isLoading } = useDoctorSearch(currentCoordinates, 5000);
  const [showLocation, setShowLocation] = useState(false);
  
  const location = useLocation();
  const { profile } = useAuth();

  // Fetch user's connected doctor
  const { data: connectedDoctor } = useQuery({
    queryKey: ['connectedDoctor', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('user_doctors')
          .select('doctor_id')
          .eq('user_id', profile?.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data?.doctor_id || null;
      } catch (err) {
        console.error("Error fetching connected doctor:", err);
        return null;
      }
    },
  });

  useEffect(() => {
    // Initialize with Luxembourg City as default
    if (!locationCoordinates) {
      try {
        handleCitySearch("Luxembourg City");
      } catch (err) {
        console.error("Error searching for Luxembourg City:", err);
      }
    }
  }, []);

  const searchDoctor = (searchTerm: string) => {
    try {
      setSearch(searchTerm);
      handleCitySearch(searchTerm);
      console.log("Searching for doctors near:", searchTerm);
    } catch (err) {
      console.error("Error searching for doctor:", err);
    }
  };

  const handleConnectDoctor = async (doctorId: string, source?: 'database' | 'overpass') => {
    if (!profile?.id) {
      toast({
        title: "Login Required",
        description: "Please login to connect with doctors.",
      });
      return;
    }

    try {
      // Check if user already has a connected doctor
      if (connectedDoctor) {
        toast({
          title: "Already Connected",
          description: "You can only connect to one doctor at a time.",
          variant: "destructive"
        });
        return;
      }

      // Connect to the doctor
      const { error } = await supabase
        .from('user_doctors')
        .insert({ user_id: profile.id, doctor_id: doctorId });
      
      if (error) throw error;
      
      toast({
        title: "Connected to Doctor",
        description: "You have successfully connected to this doctor.",
      });
    } catch (err) {
      console.error('Error connecting to doctor:', err);
      toast({
        title: "Error",
        description: "Failed to connect to doctor",
        variant: "destructive"
      });
    }
  };

  const toggleLocationDisplay = (checked: boolean) => {
    setShowLocation(checked);
    console.log("Location display toggled:", checked);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        <SearchHeader
          onSearch={searchDoctor}
          title="Find a Doctor Near You"
        />

        <div className="container mx-auto py-8 px-4">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex items-center space-x-2 mb-6">
              <Switch
                id="location-toggle"
                checked={showLocation}
                onCheckedChange={toggleLocationDisplay}
              />
              <Label htmlFor="location-toggle">Show my location</Label>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading doctors...</p>
              </div>
            ) : (
              <DoctorListSection
                doctors={doctors}
                isLoading={isLoading}
                coordinates={currentCoordinates}
                showUserLocation={showLocation}
                onConnect={handleConnectDoctor}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchDoctors;
