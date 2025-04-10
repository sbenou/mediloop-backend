
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DoctorPatient {
  id: string;
  name: string;      // Changed from optional to required to match expected interface
  full_name: string | null;
  email: string | null;
  status?: string;
  connection_id?: string;
}

export const useDoctorPatients = (doctorId: string | undefined) => {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    
    const fetchPatients = async () => {
      try {
        setLoading(true);
        
        // Get connections to patients
        const { data: connections, error: connectionsError } = await supabase
          .from('doctor_patient_connections')
          .select(`
            id,
            patient_id,
            status
          `)
          .eq('doctor_id', doctorId);
          
        if (connectionsError) {
          throw new Error(`Error fetching doctor connections: ${connectionsError.message}`);
        }
        
        if (!connections || connections.length === 0) {
          setPatients([]);
          setLoading(false);
          return;
        }
        
        // Get the actual patient profiles
        const patientIds = connections.map(c => c.patient_id);
        
        const { data: patientProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', patientIds);
          
        if (profilesError) {
          throw new Error(`Error fetching patient profiles: ${profilesError.message}`);
        }
        
        if (!patientProfiles) {
          setPatients([]);
          setLoading(false);
          return;
        }
        
        // Map the data together
        if (patientProfiles && Array.isArray(patientProfiles)) {
          const patientsWithStatus = patientProfiles.map(patient => {
            const connection = connections.find(c => c.patient_id === patient.id);
            return {
              id: patient.id,
              name: patient.full_name || 'Unknown Patient', // Always provide a name
              full_name: patient.full_name || 'Unknown Patient',
              email: patient.email || null,
              status: connection?.status || 'unknown',
              connection_id: connection?.id || undefined
            };
          });
          
          setPatients(patientsWithStatus);
        } else {
          setPatients([]);
        }
      } catch (err) {
        console.error('Error in useDoctorPatients:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [doctorId]);
  
  return { patients, loading, error };
};

export default useDoctorPatients;
