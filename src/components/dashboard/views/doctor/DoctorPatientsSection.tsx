
import React from "react";
import { Button } from "@/components/ui/button";
import PatientTable from "../pharmacy/PatientTable";

interface DoctorPatientsSectionProps {
  patients: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
  }>;
  isLoading: boolean;
  onViewPatient: (patientId: string) => void;
  onViewAllPatients: () => void;
  limit?: number;
  showViewAll?: boolean;
}

const DoctorPatientsSection: React.FC<DoctorPatientsSectionProps> = ({
  patients,
  isLoading,
  onViewPatient,
  onViewAllPatients,
  limit = 5,
  showViewAll = true
}) => {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-6">
      {showViewAll && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Patients</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewAllPatients}
          >
            View All
          </Button>
        </div>
      )}
      
      <PatientTable 
        patients={patients}
        isLoading={isLoading}
        onViewPatient={onViewPatient}
        limit={limit}
      />
    </div>
  );
};

export default DoctorPatientsSection;
