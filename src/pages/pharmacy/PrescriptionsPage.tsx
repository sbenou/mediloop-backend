
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PrescriptionStatus } from "@/types/supabase";
import { toast } from "@/components/ui/use-toast";

// Mock data - would be replaced with real data from database
const mockPrescriptions = [
  { 
    id: "1", 
    patient: "John Doe", 
    doctor: "Dr. Smith", 
    date: "2023-06-15", 
    status: "active" as PrescriptionStatus,
    medications: [
      { name: "Amoxicillin", dosage: "500mg", frequency: "3x daily" },
      { name: "Ibuprofen", dosage: "400mg", frequency: "as needed" }
    ]
  },
  { 
    id: "2", 
    patient: "Jane Smith", 
    doctor: "Dr. Johnson", 
    date: "2023-06-14", 
    status: "active" as PrescriptionStatus,
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "1x daily" }
    ]
  },
  { 
    id: "3", 
    patient: "Bob Johnson", 
    doctor: "Dr. Williams", 
    date: "2023-06-13", 
    status: "completed" as PrescriptionStatus,
    medications: [
      { name: "Metformin", dosage: "500mg", frequency: "2x daily" },
      { name: "Glipizide", dosage: "5mg", frequency: "1x daily" }
    ]
  },
];

const PrescriptionsPage = () => {
  const navigate = useNavigate();

  const handleViewPrescription = (prescriptionId: string) => {
    navigate(`/pharmacy/prescriptions/${prescriptionId}`);
  };

  const handleAddToCart = (medicationName: string) => {
    toast({
      title: "Added to Cart",
      description: `${medicationName} has been added to the cart`,
    });
  };

  const getStatusColor = (status: PrescriptionStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                    <Badge variant="outline" className={getStatusColor(prescription.status)}>
                      {prescription.status}
                    </Badge>
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
