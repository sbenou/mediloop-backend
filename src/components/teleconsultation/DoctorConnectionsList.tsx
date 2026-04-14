import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar } from "lucide-react";
import type { ConnectionStatus } from "@/types/clinical";
import { fetchDoctorPatientConnectionsApi } from "@/services/clinicalApi";

interface DoctorConnection {
  id: string;
  doctor_id: string;
  status: ConnectionStatus;
  doctor: {
    id: string;
    full_name: string;
    email: string | null;
    license_number?: string | null;
  };
}

interface DoctorConnectionsListProps {
  onSelectDoctor: (doctorId: string, doctorName: string) => void;
}

const DoctorConnectionsList: React.FC<DoctorConnectionsListProps> = ({
  onSelectDoctor,
}) => {
  const { profile } = useAuth();
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctorConnections = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const rows = await fetchDoctorPatientConnectionsApi();
      const accepted = rows
        .filter((c) => c.status === "accepted" && c.doctor)
        .map((c) => ({
          id: c.id,
          doctor_id: c.doctor_id,
          status: c.status,
          doctor: c.doctor!,
        }));
      setConnections(accepted);
    } catch (e) {
      console.error("Error fetching doctor connections:", e);
      setError("Error fetching doctor connections");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchDoctorConnections();
  }, [fetchDoctorConnections]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Doctors</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button variant="outline" onClick={fetchDoctorConnections}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Connected Doctors</CardTitle>
          <CardDescription>
            You need to connect with a doctor before you can request a teleconsultation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            variant="outline"
            onClick={() =>
              (window.location.href =
                "/dashboard?view=profile&profileTab=doctor")
            }
          >
            <User className="h-4 w-4 mr-2" /> Connect with a Doctor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Your Doctors</h3>
      <p className="text-muted-foreground">
        Select a doctor to request a teleconsultation
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((connection) => (
          <Card
            key={connection.id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <CardTitle>{connection.doctor.full_name}</CardTitle>
              <CardDescription>
                {connection.doctor.email ?? ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() =>
                  onSelectDoctor(
                    connection.doctor.id,
                    connection.doctor.full_name,
                  )
                }
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" /> Schedule Consultation
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DoctorConnectionsList;
