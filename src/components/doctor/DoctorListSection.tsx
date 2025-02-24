
import { useEffect, useState } from "react";
import { LocationToggle } from "@/components/shared/LocationToggle";
import { toast } from "@/hooks/use-toast";
import L from 'leaflet';

interface DoctorListSectionProps {
  doctors: any[] | undefined;
  isLoading: boolean;
  coordinates: { lat: number; lon: number } | null;
  onConnect: (doctorId: string, source: string) => void;
}

const DoctorListSection = ({
  doctors = [],
  isLoading,
  coordinates,
  onConnect
}: DoctorListSectionProps) => {
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [showDefaultLocation, setShowDefaultLocation] = useState(false);

  const handleLocationToggle = (checked: boolean) => {
    setShowDefaultLocation(checked);
    if (checked && coordinates) {
      toast({
        title: "Using location",
        description: "Currently showing doctors within 2km of your location",
      });
    }
  };

  useEffect(() => {
    if (!coordinates?.lat || !coordinates?.lon || !Array.isArray(doctors)) {
      setFilteredDoctors([]);
      return;
    }

    if (showDefaultLocation) {
      try {
        const userLocation = L.latLng(coordinates.lat, coordinates.lon);
        const nearbyDoctors = doctors.filter(doctor => {
          if (!doctor?.coordinates?.lat || !doctor?.coordinates?.lon) return false;
          try {
            const doctorLocation = L.latLng(
              parseFloat(doctor.coordinates.lat), 
              parseFloat(doctor.coordinates.lon)
            );
            return userLocation.distanceTo(doctorLocation) <= 2000; // 2km radius
          } catch (error) {
            console.error('Error calculating distance for doctor:', doctor, error);
            return false;
          }
        });
        setFilteredDoctors(nearbyDoctors);
      } catch (error) {
        console.error('Error creating user location:', error);
        setFilteredDoctors([]);
      }
    } else {
      setFilteredDoctors(doctors);
    }
  }, [showDefaultLocation, coordinates, doctors]);

  return (
    <div className="space-y-4">
      <LocationToggle
        showDefaultLocation={showDefaultLocation}
        onLocationToggle={handleLocationToggle}
      />
      {isLoading ? (
        <div>Loading doctors...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor: any) => (
            <div key={doctor.id} className="p-4 border rounded-lg">
              <h3 className="font-bold">{doctor.name || doctor.full_name}</h3>
              <p>{doctor.address || doctor.city}</p>
              <button 
                onClick={() => onConnect(doctor.id, doctor.source)}
                className="mt-2 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                Connect
              </button>
            </div>
          ))}
          {filteredDoctors.length === 0 && (
            <p className="text-center col-span-full">No doctors found in this area</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DoctorListSection;
