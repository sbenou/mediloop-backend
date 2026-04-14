
import React, { useEffect, useState } from "react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchPharmacyPatientsApi } from "@/services/clinicalApi";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  city?: string;
}

const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching patients for pharmacy view");
        
        const rows = await fetchPharmacyPatientsApi();
        const mapped: Patient[] = rows.slice(0, 200).map((r) => ({
          id: r.id,
          full_name: r.full_name ?? "",
          email: r.email ?? "",
          created_at: r.created_at,
          city: undefined,
        }));
        setPatients(mapped);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError('Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleViewPatient = (patientId: string) => {
    // Use direct navigation without state to prevent freezing
    navigate(`/pharmacy/patients/${patientId}`);
  };

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            View and manage all your patients.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Since</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                      <span>Loading patients...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No patients found.
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.full_name || 'Unknown'}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.city || 'Unknown'}</TableCell>
                    <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewPatient(patient.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PharmacistLayout>
  );
};

export default PatientsPage;
