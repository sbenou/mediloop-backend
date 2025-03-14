
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Eye, Plus, Edit, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  created_at: string;
  doctor_name?: string;
  patient_name?: string;
  status?: string;
  sent_to_pharmacy?: boolean;
}

const DoctorPrescriptionsView = () => {
  const { profile } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        
        // Fetch prescriptions created by this doctor
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            *,
            patient:patient_id(full_name)
          `)
          .eq('doctor_id', profile?.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Transform data to include patient_name
        const formattedData = data.map((prescription: any) => ({
          ...prescription,
          patient_name: prescription.patient?.full_name || "Unknown Patient",
          // For demo purposes - in real app this would be a separate field in the table
          sent_to_pharmacy: prescription.status === 'sent' || Math.random() > 0.5
        }));
        
        setPrescriptions(formattedData);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load prescriptions. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (profile?.id) {
      fetchPrescriptions();
    }
  }, [profile?.id]);

  const handleViewPrescription = (id: string) => {
    navigate(`/prescriptions/${id}`);
  };

  const handleCreatePrescription = () => {
    navigate('/create-prescription');
  };

  const handleEditPrescription = (id: string, sentToPharmacy: boolean) => {
    if (sentToPharmacy) {
      toast({
        variant: "destructive",
        title: "Cannot edit",
        description: "This prescription has already been sent to a pharmacy and cannot be modified.",
      });
      return;
    }
    navigate(`/edit-prescription/${id}`);
  };

  const handleDeletePrescription = async (id: string, sentToPharmacy: boolean) => {
    if (sentToPharmacy) {
      toast({
        variant: "destructive",
        title: "Cannot delete",
        description: "This prescription has already been sent to a pharmacy and cannot be deleted.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id)
        .eq('doctor_id', profile?.id); // Ensure only the doctor who created it can delete it
      
      if (error) throw error;
      
      // Remove from local state
      setPrescriptions(prescriptions.filter(p => p.id !== id));
      
      toast({
        title: "Prescription deleted",
        description: "The prescription has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting prescription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete prescription. Please try again.",
      });
    }
  };

  const renderLoading = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <p className="text-lg">No prescriptions found</p>
      <p className="text-muted-foreground mt-2">
        Create new prescriptions for your patients
      </p>
      <Button 
        onClick={handleCreatePrescription} 
        className="mt-4"
      >
        <Plus className="h-4 w-4 mr-1" /> Create Prescription
      </Button>
    </div>
  );

  const renderPrescriptionList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Prescriptions</h2>
        <Button onClick={handleCreatePrescription}>
          <Plus className="h-4 w-4 mr-1" /> Create Prescription
        </Button>
      </div>
      
      {prescriptions.map((prescription) => (
        <Card key={prescription.id} className={prescription.sent_to_pharmacy ? 'border-l-4 border-l-blue-500' : ''}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{prescription.medication_name}</CardTitle>
              {prescription.sent_to_pharmacy && 
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Sent to pharmacy
                </span>
              }
            </div>
            <p className="text-sm text-muted-foreground">
              Patient: {prescription.patient_name}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Dosage</p>
                <p className="font-medium">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium">{prescription.frequency}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{prescription.duration}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Created: {new Date(prescription.created_at).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleViewPrescription(prescription.id)}
                >
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditPrescription(prescription.id, prescription.sent_to_pharmacy || false)}
                  className={prescription.sent_to_pharmacy ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeletePrescription(prescription.id, prescription.sent_to_pharmacy || false)}
                  className={prescription.sent_to_pharmacy ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Patient Prescriptions</h1>
      <p className="text-muted-foreground mb-8">Manage medical prescriptions for your patients</p>
      
      {loading ? (
        renderLoading()
      ) : prescriptions.length === 0 ? (
        renderEmptyState()
      ) : (
        renderPrescriptionList()
      )}
    </div>
  );
};

export default DoctorPrescriptionsView;
