
import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/auth/useAuth';
import { useDoctorFinder } from '@/hooks/useDoctorFinder';
import { DoctorFinderMap } from '@/components/doctor/finder/DoctorFinderMap';
import { DoctorFinderList } from '@/components/doctor/finder/DoctorFinderList';
import { DoctorSearch } from '@/components/doctor/finder/DoctorSearch';

interface Doctor {
  id: string;
  full_name: string;
  city?: string;
  license_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  distance?: number | string;
  source?: 'database' | 'overpass';
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
}

const FindDoctor = () => {
  console.log('FindDoctor component rendering');
  const userLocation = useRecoilValue(userLocationState);
  console.log('User location from state:', userLocation);
  const { isAuthenticated } = useAuth();
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [leafletFilteredDoctors, setLeafletFilteredDoctors] = useState<Doctor[]>([]);
  
  // Use our custom hook for doctor finding logic
  const { 
    doctors, 
    filteredDoctors,
    isLoading, 
    error,
    searchQuery,
    setSearchQuery,
    useLocationFilter,
    setUseLocationFilter
  } = useDoctorFinder(userLocation);

  console.log('Doctors loaded:', doctors?.length || 0);
  console.log('Filtered doctors:', filteredDoctors?.length || 0);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  // Initialize filtered doctors with all doctors
  useEffect(() => {
    if (filteredDoctors && filteredDoctors.length > 0) {
      console.log('Setting filtered doctors:', filteredDoctors.length);
      setLeafletFilteredDoctors(filteredDoctors);
    }
  }, [filteredDoctors]);

  // Show error if API fails
  useEffect(() => {
    if (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error loading doctors",
        description: "There was a problem loading doctor data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error]);

  // Handle doctors filtered by map shape
  const handleDoctorsInShape = (shapeFilteredDoctors: Doctor[]) => {
    console.log("Doctors in shape:", shapeFilteredDoctors.length);
    setLeafletFilteredDoctors(shapeFilteredDoctors);
  };

  const handleConnectDoctor = (doctorId: string, source?: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to connect with doctors.",
      });
      return;
    }

    if (source === 'overpass') {
      toast({
        title: "Information",
        description: "Connection requests are only available for registered doctors.",
      });
      return;
    }
    
    toast({
      title: "Connect with Doctor",
      description: `Request sent to doctor`,
    });
  };

  console.log('Rendering FindDoctor with view mode:', viewMode);

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find a Doctor Near You</h1>
          <p className="text-muted-foreground">
            Browse doctor locations and find one that meets your needs
          </p>
        </div>
        
        {/* Search and filter controls */}
        <DoctorSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          useLocationFilter={useLocationFilter}
          setUseLocationFilter={setUseLocationFilter}
          userLocation={userLocation}
        />
        
        {/* View mode tabs */}
        <Tabs defaultValue="list" className="mt-6" onValueChange={(value) => {
          console.log('Changing view mode to:', value);
          setViewMode(value as 'list' | 'map');
        }}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-4">
            <DoctorFinderList 
              doctors={filteredDoctors}
              isLoading={isLoading}
              userLocation={userLocation}
              onConnect={handleConnectDoctor}
            />
          </TabsContent>
          
          <TabsContent value="map" className="mt-4">
            <Card className="p-1 shadow-sm">
              <CardContent className="p-0 h-[600px] relative">
                <DoctorFinderMap 
                  doctors={filteredDoctors}
                  userLocation={userLocation}
                  useLocationFilter={useLocationFilter}
                  onDoctorSelect={(doctorId, source) => handleConnectDoctor(doctorId, source)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default FindDoctor;
