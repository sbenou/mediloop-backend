
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";
import Header from "@/components/layout/Header";

// Mock data - would be replaced with real data from database
const mockPatient = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "123-456-7890",
  dateOfBirth: "1985-05-15",
  address: "123 Main St, New York, NY 10001"
};

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // In a real app, fetch the patient data based on the ID
  
  return (
    <div>
      <Header />
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/pharmacy/patients')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Button>
          
          <h1 className="text-2xl font-bold">{mockPatient.name}</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p>{mockPatient.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{mockPatient.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{mockPatient.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                  <p>{new Date(mockPatient.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{mockPatient.address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
