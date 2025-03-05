
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Calendar } from 'lucide-react';
import { ConnectionStatus } from '@/types/supabase';

interface DoctorConnection {
  id: string;
  doctor_id: string;
  status: ConnectionStatus;
  doctor: {
    id: string;
    full_name: string;
    email: string;
    license_number?: string;
  };
}

interface DoctorConnectionsListProps {
  onSelectDoctor: (doctorId: string, doctorName: string) => void;
}

const DoctorConnectionsList: React.FC<DoctorConnectionsListProps> = ({ onSelectDoctor }) => {
  const { profile } = useAuth();
  const [connections, setConnections] = useState<DoctorConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorConnections();
  }, [profile?.id]);

  const fetchDoctorConnections = async () => {
    if (!profile?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .select(`
          id,
          doctor_id,
          status,
          doctor:profiles!doctor_id(id, full_name, email, license_number)
        `)
        .eq('patient_id', profile.id)
        .eq('status', 'accepted');

      if (error) throw error;
      
      // Type assertion to ensure data matches our interface
      setConnections(data as unknown as DoctorConnection[]);
    } catch (error) {
      console.error('Error fetching doctor connections:', error);
      setError('Error fetching doctor connections');
    } finally {
      setLoading(false);
    }
  };

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
          <CardDescription>
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            variant="outline" 
            onClick={fetchDoctorConnections}
          >
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
            onClick={() => window.location.href = '/dashboard?view=profile&profileTab=doctor'}
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
        {connections.map(connection => (
          <Card key={connection.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>{connection.doctor.full_name}</CardTitle>
              <CardDescription>{connection.doctor.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => onSelectDoctor(connection.doctor.id, connection.doctor.full_name)}
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
