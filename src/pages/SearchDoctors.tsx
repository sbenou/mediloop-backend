
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import SimplePharmacyMap from '@/components/pharmacy/SimplePharmacyMap';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
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

  useEffect(() => {
    // Set filtered doctors when data loads
    if (doctors && doctors.length > 0) {
      console.log("Setting filtered doctors:", doctors.length);
      setFilteredDoctors(doctors);
    }
  }, [doctors]);

  const searchDoctor = (searchTerm: string) => {
    try {
      setSearch(searchTerm);
      handleCitySearch(searchTerm);
      console.log("Searching for doctors near:", searchTerm);
    } catch (err) {
      console.error("Error searching for doctor:", err);
    }
  };

  const handleConnectDoctor = async (doctorId: string) => {
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

  const handleSetConnectedDoctor = async (doctorId: string, isConnected: boolean) => {
    if (!profile) {
      toast({
        title: "Login Required",
        description: "Please login to connect with a doctor.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isConnected) {
        // Connect to doctor
        await supabase
          .from('user_doctors')
          .upsert({ user_id: profile.id, doctor_id: doctorId });
        
        toast({
          title: "Connected to Doctor",
          description: "You are now connected to this doctor.",
        });
      } else {
        // Disconnect from doctor
        await supabase
          .from('user_doctors')
          .delete()
          .eq('user_id', profile.id)
          .eq('doctor_id', doctorId);
          
        toast({
          title: "Doctor Disconnected",
          description: "You are no longer connected to this doctor.",
        });
      }
    } catch (err) {
      console.error('Error updating doctor connection:', err);
      toast({
        title: "Error",
        description: "Failed to update doctor connection",
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
              <div className="grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
                {/* Doctor List */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  {filteredDoctors.length === 0 ? (
                    <p className="text-center py-8">No doctors found</p>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <Card key={doctor.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 mb-4">
                              <Checkbox
                                id={`connect-${doctor.id}`}
                                checked={connectedDoctor === doctor.id}
                                onCheckedChange={(checked) => 
                                  handleSetConnectedDoctor(doctor.id, !!checked)
                                }
                              />
                              <Label htmlFor={`connect-${doctor.id}`}>Connect with this doctor</Label>
                            </div>
                            
                            <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                            <p className="text-sm text-gray-500">{doctor.city}</p>
                            {doctor.license_number && (
                              <p className="text-sm">License: {doctor.license_number}</p>
                            )}
                            {doctor.email && (
                              <p className="text-sm">✉️ {doctor.email}</p>
                            )}
                            {doctor.hours && (
                              <p className="text-sm">⏰ {doctor.hours}</p>
                            )}
                            {doctor.distance && (
                              <p className="text-sm font-medium">📍 {doctor.distance} km</p>
                            )}
                            
                            <button
                              onClick={() => handleConnectDoctor(doctor.id)}
                              className="w-full mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Connect
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                
                {/* Map */}
                <div className="h-full">
                  <SimplePharmacyMap
                    pharmacies={filteredDoctors}
                    userLocation={showLocation ? currentCoordinates : null}
                    height="calc(100vh - 220px)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchDoctors;
