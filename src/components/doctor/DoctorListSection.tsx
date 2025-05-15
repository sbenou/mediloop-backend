
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Map, List } from "lucide-react";
import DoctorList from "./DoctorList";
import DoctorMap from "./DoctorMap";

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  coordinates?: { lat: number; lon: number } | null;
  source?: 'database' | 'overpass';
}

interface DoctorListSectionProps {
  doctors: Doctor[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number } | null;
  showUserLocation?: boolean;
  onConnect: (doctorId: string, source: 'database' | 'overpass') => void;
}

const DoctorListSection = ({
  doctors,
  isLoading,
  coordinates,
  showUserLocation = false,
  onConnect
}: DoctorListSectionProps) => {
  const [viewMode, setViewMode] = useState<string>("list");
  const cityFromCoordinates = "nearby location"; // Could be replaced with reverse geocoding

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isLoading
            ? "Finding doctors..."
            : doctors.length > 0
            ? `Found ${doctors.length} doctors`
            : "No doctors found"}
        </h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="hidden">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-0">
          <DoctorList
            doctors={doctors}
            isLoading={isLoading}
            onConnect={onConnect}
            searchCity={cityFromCoordinates}
          />
        </TabsContent>
        
        <TabsContent value="map" className="mt-0">
          <div className="rounded-lg overflow-hidden mb-6">
            <DoctorMap 
              doctors={doctors} 
              userCoordinates={coordinates} 
              showUserLocation={showUserLocation}
              onDoctorSelect={(doctorId) => {
                const doctor = doctors.find(d => d.id === doctorId);
                if (doctor) {
                  onConnect(doctorId, doctor.source || 'database');
                }
              }}
            />
          </div>
          
          <DoctorList
            doctors={doctors}
            isLoading={isLoading}
            onConnect={onConnect}
            searchCity={cityFromCoordinates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorListSection;
