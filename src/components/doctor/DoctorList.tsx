
import { Skeleton } from "@/components/ui/skeleton";
import DoctorCard from "./DoctorCard";

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  email?: string;
  hours?: string;
  source?: 'database' | 'overpass';
}

interface DoctorListProps {
  doctors: Doctor[] | undefined;
  isLoading: boolean;
  onConnect: (doctorId: string, source: 'database' | 'overpass') => void;
  searchCity: string;
}

const DoctorList = ({ doctors, isLoading, onConnect, searchCity }: DoctorListProps) => {
  // Ensure doctors is always an array
  const validDoctors = Array.isArray(doctors) ? doctors : [];
  
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (validDoctors.length === 0) {
    return (
      <p className="text-center text-gray-500">
        {searchCity ? `No doctors found in ${searchCity}` : "No doctors found. Try searching for a different location."}
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {validDoctors.map((doctor) => (
        <DoctorCard
          key={doctor.id}
          {...doctor}
          onConnect={() => onConnect(doctor.id, doctor.source || 'database')}
        />
      ))}
    </div>
  );
};

export default DoctorList;
