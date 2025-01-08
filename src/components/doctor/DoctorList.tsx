import { Skeleton } from "@/components/ui/skeleton";
import DoctorCard from "./DoctorCard";

interface Doctor {
  id: string;
  full_name: string;
  city: string;
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
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (doctors?.length === 0 && searchCity) {
    return <p className="text-center text-gray-500">No doctors found in {searchCity}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {doctors?.map((doctor) => (
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