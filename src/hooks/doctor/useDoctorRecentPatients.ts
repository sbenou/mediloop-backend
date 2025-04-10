
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RecentPatientData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string; // Added this field to match the expected type
}

export const useDoctorRecentPatients = (doctorId: string | undefined) => {
  const [recentPatients, setRecentPatients] = useState<RecentPatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    const fetchRecentPatients = async () => {
      try {
        setLoading(true);
        
        // Get connections to patients
        const { data: connections, error: connectionsError } = await supabase
          .from('doctor_patient_connections')
          .select(`
            id,
            patient_id,
            status,
            created_at
          `)
          .eq('doctor_id', doctorId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (connectionsError) {
          throw new Error(`Error fetching doctor connections: ${connectionsError.message}`);
        }
        
        if (!connections || connections.length === 0) {
          setRecentPatients([]);
          setLoading(false);
          return;
        }
        
        // Get the actual patient profiles
        const patientIds = connections.map(c => c.patient_id);
        
        const { data: patientProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, created_at')
          .in('id', patientIds);
          
        if (profilesError) {
          throw new Error(`Error fetching patient profiles: ${profilesError.message}`);
        }
        
        if (!patientProfiles || !Array.isArray(patientProfiles)) {
          setRecentPatients([]);
          return;
        }
        
        // Ensure all patients have the required fields
        const formattedPatients: RecentPatientData[] = patientProfiles.map(patient => ({
          id: patient.id,
          full_name: patient.full_name,
          avatar_url: patient.avatar_url,
          created_at: patient.created_at || new Date().toISOString() // Ensure created_at always has a value
        }));
        
        setRecentPatients(formattedPatients);
      } catch (err) {
        console.error('Error in useDoctorRecentPatients:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentPatients();
  }, [doctorId]);
  
  return { recentPatients, loading, error };
};
