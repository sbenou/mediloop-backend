
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";

export const useDoctorRecentPatients = (limit: number = 5) => {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPatients = async () => {
      if (!profile?.id) return;

      try {
        setIsLoading(true);
        
        // Get recent connections with patients with 'accepted' status
        const { data, error } = await supabase
          .from('doctor_patient_connections')
          .select(`
            id,
            patient_id,
            created_at,
            status,
            patient:profiles!patient_id(
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('doctor_id', profile.id)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Transform and filter data to desired format
        const formattedPatients = data
          .filter(connection => connection.patient && typeof connection.patient === 'object' && !('error' in connection.patient))
          .map(connection => ({
            id: connection.patient_id,
            full_name: connection.patient.full_name || 'Unknown Patient',
            avatar_url: connection.patient.avatar_url,
            created_at: connection.created_at
          }));

        setPatients(formattedPatients);
      } catch (err) {
        console.error('Error fetching recent patients:', err);
        setError('Failed to load recent patients');
        toast({
          variant: "destructive",
          title: "Error loading patients",
          description: "There was a problem loading your recent patients."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPatients();
  }, [profile?.id, limit]);

  return { patients, isLoading, error };
};

export default useDoctorRecentPatients;
