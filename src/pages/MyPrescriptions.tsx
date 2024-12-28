import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilePlus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data - in a real app, this would come from an API
const MOCK_PRESCRIPTIONS = [
  {
    id: 1,
    patientName: "John Doe",
    createdAt: "2024-03-15",
    medications: [
      {
        name: "Amoxicillin",
        frequency: "daily",
        dosesPerFrequency: "3",
        quantity: "30 tablets"
      }
    ],
    doctorName: "Dr. Smith",
    doctorAddress: "123 Medical Center",
    patientAddress: "456 Patient St"
  },
  {
    id: 2,
    patientName: "John Doe",
    createdAt: "2024-03-14",
    medications: [
      {
        name: "Ibuprofen",
        frequency: "daily",
        dosesPerFrequency: "2",
        quantity: "20 tablets"
      }
    ],
    doctorName: "Dr. Johnson",
    doctorAddress: "789 Health Ave",
    patientAddress: "456 Patient St"
  }
];

const MyPrescriptions = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">My Prescriptions</h1>
        <Button
          onClick={() => navigate('/create-prescription')}
          className="flex items-center space-x-2"
        >
          <FilePlus className="h-4 w-4" />
          <span>Create New Prescription</span>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created Date</TableHead>
              <TableHead>Medications</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PRESCRIPTIONS.map((prescription) => (
              <TableRow key={prescription.id}>
                <TableCell>{prescription.createdAt}</TableCell>
                <TableCell>
                  {prescription.medications.map(med => med.name).join(", ")}
                </TableCell>
                <TableCell>{prescription.doctorName}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/prescription/${prescription.id}`, { state: { data: prescription } })}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MyPrescriptions;