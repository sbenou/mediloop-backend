
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { fetchPrescriptionsApi } from "@/services/clinicalApi";

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
}

const PrescriptionsPage = () => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const data = await fetchPrescriptionsApi();
        const prescriptionsWithNames = data.map((p) => ({
          id: p.id,
          patient_id: String(p.patient_id ?? ""),
          doctor_id: String(p.doctor_id ?? ""),
          medication_name: p.medication_name,
          created_at: p.created_at,
          patient_name: p.patient_full_name ?? "Unknown Patient",
          doctor_name: p.doctor_full_name ?? "Unknown Doctor",
        }));
        setPrescriptions(prescriptionsWithNames);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prescriptions</h1>
          <p className="text-muted-foreground">
            View and manage all prescriptions sent by doctors.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date Prescribed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading prescriptions...
                  </TableCell>
                </TableRow>
              ) : prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No prescriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{prescription.medication_name}</TableCell>
                    <TableCell>{prescription.patient_name || 'Unknown'}</TableCell>
                    <TableCell>{prescription.doctor_name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(prescription.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/pharmacy/prescriptions/${prescription.id}`)}
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

export default PrescriptionsPage;
