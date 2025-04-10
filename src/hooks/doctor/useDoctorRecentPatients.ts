import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define a proper interface for patient data
interface RecentPatientData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  last_visit?: string | null;
}

export const useDoctorRecentPatients = (doctorId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [recentPatients, setRecentPatients] = useState<RecentPatientData[]>([]);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    
    const fetchRecentPatients = async () => {
      try {
        setLoading(true);
        
        // Fetch recent patients - This would usually be based on appointments or teleconsultations
        // For now, we'll just get patients with connections to this doctor
        const { data: connections, error: connectionsError } = await supabase
          .from('doctor_patient_connections')
          .select(`
            patient_id,
            created_at
          `)
          .eq('doctor_id', doctorId)
          .eq('status', 'accepted')
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
        const { data: patients, error: patientsError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', patientIds);
          
        if (patientsError) {
          throw new Error(`Error fetching patient profiles: ${patientsError.message}`);
        }
        
        if (patients && Array.isArray(patients)) {
          const formattedPatients = patients.map(patient => ({
            id: patient.id,
            full_name: patient.full_name || 'Unknown Patient',
            avatar_url: patient.avatar_url || null,
            // We could add last visit date from appointments/teleconsultations later
          }));
          
          setRecentPatients(formattedPatients);
        } else {
          setRecentPatients([]);
        }
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
