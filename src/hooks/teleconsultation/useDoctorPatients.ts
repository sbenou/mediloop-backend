
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

export interface DoctorPatientConnection {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  patient: {
    id: string;
    full_name: string;
    email?: string;
  };
}

export const useDoctorPatients = (doctorId?: string) => {
  const [patients, setPatients] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!doctorId) {
        setPatients([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch doctor's connected patients that have accepted status
        const { data, error } = await supabase
          .from('doctor_patient_connections')
          .select(`
            id,
            patient_id,
            doctor_id,
            status,
            patient:profiles(
              id,
              full_name,
              email
            )
          `)
          .eq('doctor_id', doctorId)
          .eq('status', 'accepted');

        if (error) throw error;

        // Type casting to handle potential Supabase errors properly
        const connections = data as unknown as any[];
        
        // Format patients data
        const formattedPatients = connections
          .filter(connection => connection.patient && !connection.patient.error)
          .map(connection => ({
            id: connection.patient_id,
            name: connection.patient.full_name || 'Unknown Patient'
          }));

        setPatients(formattedPatients);
      } catch (err) {
        console.error('Error fetching doctor patients:', err);
        setError('Failed to load patients');
        toast({
          variant: "destructive",
          title: "Error loading patients",
          description: "There was a problem loading your patients. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [doctorId]);

  return { patients, isLoading, error };
};
