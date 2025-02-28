
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data - would be replaced with real data from database
const mockPatients = [
  { id: "1", name: "John Doe", email: "john.doe@example.com", phone: "123-456-7890" },
  { id: "2", name: "Jane Smith", email: "jane.smith@example.com", phone: "234-567-8901" },
  { id: "3", name: "Bob Johnson", email: "bob.johnson@example.com", phone: "345-678-9012" },
  { id: "4", name: "Alice Brown", email: "alice.brown@example.com", phone: "456-789-0123" },
];

const PatientsPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';
  const navigate = useNavigate();

  const handleViewPatient = (patientId: string) => {
    navigate(`/pharmacy/patients/${patientId}`);
  };

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground mt-2">View and manage patient information</p>
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewPatient(patient.id)}
                          title="View Patient"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

export default PatientsPage;
