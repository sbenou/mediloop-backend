
import { useParams, useNavigate } from "react-router-dom";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, MapPin, UserRound } from "lucide-react";

// Mock data - would be replaced with real data from database
const mockPatient = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "123-456-7890",
  dateOfBirth: "1985-05-15",
  addresses: [
    {
      id: "a1",
      type: "Home",
      street: "123 Main St",
      city: "New York",
      postalCode: "10001",
      country: "USA",
      isDefault: true
    },
    {
      id: "a2",
      type: "Work",
      street: "456 Business Ave",
      city: "New York",
      postalCode: "10002",
      country: "USA",
      isDefault: false
    }
  ],
  doctor: {
    id: "d1",
    name: "Dr. Sarah Smith",
    specialty: "Family Medicine",
    clinic: "City Health Clinic",
    phone: "123-789-4560"
  }
};

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // In a real app, fetch the patient data based on the ID
  
  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/pharmacy/patients')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
        
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" alt={mockPatient.name} />
            <AvatarFallback className="text-lg">{mockPatient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{mockPatient.name}</h1>
            <p className="text-muted-foreground">{mockPatient.email}</p>
          </div>
        </div>
        
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="h-4 w-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="doctor">
              <UserRound className="h-4 w-4 mr-2" />
              Doctor
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>View patient's personal details</CardDescription>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="addresses">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockPatient.addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{address.type}</CardTitle>
                      {address.isDefault && (
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Default
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p>{address.street}</p>
                    <p>{address.city}, {address.postalCode}</p>
                    <p>{address.country}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="doctor">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Information</CardTitle>
                <CardDescription>Patient's primary healthcare provider</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Doctor Name</p>
                    <p>{mockPatient.doctor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Specialty</p>
                    <p>{mockPatient.doctor.specialty}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clinic</p>
                    <p>{mockPatient.doctor.clinic}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{mockPatient.doctor.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

export default PatientDetail;
