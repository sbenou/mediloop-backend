
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { fetchPrescriptionsApi } from "@/services/clinicalApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { Eye, Clock } from "lucide-react";
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
}

interface PrescriptionsViewProps {
  userRole: string | null;
}

function isConnectivityFailure(error: unknown): boolean {
  const msg =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed")
  );
}

const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!profile?.id) {
        setLoading(!profile);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchPrescriptionsApi();

        const formattedData = data.map((prescription) => ({
          ...prescription,
          doctor_name:
            prescription.doctor_full_name || "Unknown Doctor",
          patient_name:
            prescription.patient_full_name || "Unknown Patient",
          status: (prescription.status as string) || "active",
        }));

        setPrescriptions(formattedData);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        setPrescriptions([]);
        if (!isConnectivityFailure(error)) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load prescriptions. Please try again later.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [userRole, profile?.id]);

  const getViewTitle = () => {
    switch (userRole) {
      case 'patient':
        return 'My Prescriptions';
      case 'doctor':
        return 'Patient Prescriptions';
      case 'pharmacist':
        return 'Prescription Management';
      default:
        return 'Prescriptions';
    }
  };

  const getViewDescription = () => {
    switch (userRole) {
      case 'patient':
        return 'View and manage your prescriptions';
      case 'doctor':
        return 'Manage prescriptions for your patients';
      case 'pharmacist':
        return 'Process and fill patient prescriptions';
      default:
        return 'Prescription management';
    }
  };

  const handleViewPrescription = (id: string) => {
    if (userRole === 'patient') {
      navigate(`/my-prescriptions/${id}`);
    } else if (userRole === 'pharmacist') {
      navigate(`/prescriptions/${id}`);
    } else {
      navigate(`/prescriptions/${id}`);
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
      <p className="text-lg">No active prescriptions found</p>
      <p className="text-muted-foreground mt-2">
        {userRole === 'patient'
          ? 'Your prescriptions will appear here once you receive them from your doctor'
          : userRole === 'doctor'
          ? 'Start writing prescriptions for your patients'
          : 'Prescriptions pending fulfillment will appear here'}
      </p>
    </div>
  );

  const renderPrescriptionList = () => (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <Card key={prescription.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{prescription.medication_name}</CardTitle>
              {userRole === 'patient' && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{new Date(prescription.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
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
              {userRole === 'patient' ? (
                <p className="text-sm text-muted-foreground">
                  Prescribed by Dr. {prescription.doctor_name}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Patient: {prescription.patient_name}
                </p>
              )}
              <Button variant="outline" size="sm" onClick={() => handleViewPrescription(prescription.id)}>
                <Eye className="h-4 w-4 mr-1" /> View
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">{getViewTitle()}</h1>
      <p className="text-muted-foreground mb-8">{getViewDescription()}</p>

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

export default PrescriptionsView;
