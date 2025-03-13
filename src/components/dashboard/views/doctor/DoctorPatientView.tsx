
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { UserCircle, Mail, Phone } from "lucide-react";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  connection_status: 'pending' | 'accepted' | 'rejected';
  connection_id: string;
  created_at: string;
}

const DoctorPatientView = () => {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchPatients = async () => {
      try {
        setLoading(true);
        
        // Get connections with patients
        const { data: connections, error } = await supabase
          .from('doctor_patient_connections')
          .select(`
            id,
            status,
            created_at,
            patient:patient_id (
              id,
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('doctor_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to desired format
        const formattedPatients = connections.map((connection: any) => ({
          id: connection.patient.id,
          full_name: connection.patient.full_name,
          email: connection.patient.email,
          avatar_url: connection.patient.avatar_url,
          connection_status: connection.status,
          connection_id: connection.id,
          created_at: connection.created_at
        }));
        
        setPatients(formattedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load patients. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [profile?.id]);

  const handleAcceptPatient = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_patient_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      // Update local state
      setPatients(prevPatients => 
        prevPatients.map(patient => 
          patient.connection_id === connectionId 
            ? {...patient, connection_status: 'accepted'} 
            : patient
        )
      );

      toast({
        title: "Success",
        description: "Patient connection accepted."
      });
    } catch (error) {
      console.error('Error accepting patient:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept patient. Please try again."
      });
    }
  };

  const handleRejectPatient = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('doctor_patient_connections')
        .update({ status: 'rejected' })
        .eq('id', connectionId);

      if (error) throw error;

      // Update local state
      setPatients(prevPatients => 
        prevPatients.map(patient => 
          patient.connection_id === connectionId 
            ? {...patient, connection_status: 'rejected'} 
            : patient
        )
      );

      toast({
        title: "Success",
        description: "Patient connection rejected."
      });
    } catch (error) {
      console.error('Error rejecting patient:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject patient. Please try again."
      });
    }
  };

  const renderPatientCard = (patient: Patient) => (
    <Card key={patient.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {patient.avatar_url ? (
              <img
                src={patient.avatar_url}
                alt={patient.full_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserCircle className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{patient.full_name}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="mr-1 h-3 w-3" /> {patient.email}
            </div>
          </div>
          <div className="flex gap-2">
            {patient.connection_status === 'pending' ? (
              <>
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => handleAcceptPatient(patient.connection_id)}
                >
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleRejectPatient(patient.connection_id)}
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline">
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const filteredPatients = patients.filter(patient => {
      if (activeTab === 'pending') return patient.connection_status === 'pending';
      if (activeTab === 'active') return patient.connection_status === 'accepted';
      return true; // All tab
    });

    if (filteredPatients.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {activeTab === 'pending' 
              ? 'No pending patient requests' 
              : activeTab === 'active'
              ? 'No active patients yet'
              : 'No patients found'}
          </p>
        </div>
      );
    }

    return filteredPatients.map(renderPatientCard);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Patients</h1>
        <p className="text-muted-foreground">
          Manage your patient connections and view their information
        </p>
      </div>

      <Tabs 
        defaultValue="active" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="active">Active Patients</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorPatientView;
