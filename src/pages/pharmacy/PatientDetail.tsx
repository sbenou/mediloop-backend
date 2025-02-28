
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { UserProfile, Address } from "@/types/supabase";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch patient profile
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (patientError) throw patientError;
        setPatient(patientData);

        // Fetch patient addresses
        const { data: addressData, error: addressError } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', id)
          .order('is_default', { ascending: false });

        if (addressError) throw addressError;
        setAddresses(addressData || []);

        // In a real implementation, you would fetch doctor connections here

      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading patient information...</p>
        </div>
      </PharmacistLayout>
    );
  }

  if (!patient) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-full">
          <p>Patient not found.</p>
        </div>
      </PharmacistLayout>
    );
  }

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.full_name}</h1>
          <p className="text-muted-foreground">
            Patient profile information
          </p>
        </div>

        <Tabs defaultValue="personal">
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="doctors">My Doctor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Patient's personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p>{patient.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                    <p>{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">City</p>
                    <p>{patient.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CNS Number</p>
                    <p>{patient.cns_number || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="addresses" className="space-y-4">
            {addresses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p>No addresses found for this patient.</p>
                </CardContent>
              </Card>
            ) : (
              addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader>
                    <CardTitle>
                      {address.is_default && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 mr-2">
                          Default
                        </span>
                      )}
                      {address.type} Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-1">{address.street}</p>
                    <p className="mb-1">
                      {address.postal_code} {address.city}
                    </p>
                    <p>{address.country}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="doctors" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p>Doctor connection information would be displayed here.</p>
                <p className="text-muted-foreground mt-2">This is a placeholder for the doctor connection information.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

export default PatientDetail;
