
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

// Mock data - would be replaced with real data from database
const mockPrescriptions = [
  { id: "1", patient: "John Doe", doctor: "Dr. Smith", date: "2023-06-15", status: "active" },
  { id: "2", patient: "Jane Smith", doctor: "Dr. Johnson", date: "2023-06-14", status: "active" },
  { id: "3", patient: "Bob Johnson", doctor: "Dr. Williams", date: "2023-06-13", status: "completed" },
];

const PrescriptionsPage = () => {
  const navigate = useNavigate();

  const handleViewPrescription = (prescriptionId: string) => {
    navigate(`/pharmacy/prescriptions/${prescriptionId}`);
  };

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground mt-2">View and process patient prescriptions</p>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prescription ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPrescriptions.map((prescription) => (
                <TableRow key={prescription.id} className="cursor-pointer">
                  <TableCell className="font-medium">#{prescription.id}</TableCell>
                  <TableCell>{prescription.patient}</TableCell>
                  <TableCell>{prescription.doctor}</TableCell>
                  <TableCell>{new Date(prescription.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 
                          prescription.status === 'active' ? 'rgba(0, 200, 83, 0.1)' :
                          prescription.status === 'completed' ? 'rgba(33, 150, 243, 0.1)' : 
                          'rgba(255, 193, 7, 0.1)',
                        color:
                          prescription.status === 'active' ? 'rgb(0, 200, 83)' :
                          prescription.status === 'completed' ? 'rgb(33, 150, 243)' : 
                          'rgb(255, 193, 7)'
                      }}
                    >
                      {prescription.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewPrescription(prescription.id)}
                        title="View Prescription"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PharmacistLayout>
  );
};

export default PrescriptionsPage;
