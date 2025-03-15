
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Teleconsultation } from "@/types/supabase";
import { isPast, isFuture, isToday } from "date-fns";

export const useConsultations = (profileId: string | undefined, filterRole?: string) => {
  const [consultations, setConsultations] = useState<Teleconsultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasConnections, setHasConnections] = useState(true);
  
  // Group consultations by status
  const upcomingConsultations = consultations.filter(c => 
    c.status === 'confirmed' && isFuture(new Date(c.start_time))
  );
  
  const todayConsultations = consultations.filter(c => 
    c.status === 'confirmed' && isToday(new Date(c.start_time))
  );
  
  const pastConsultations = consultations.filter(c => 
    (c.status === 'completed' || c.status === 'confirmed') && 
    isPast(new Date(c.end_time))
  );
  
  const pendingConsultations = consultations.filter(c => 
    c.status === 'pending'
  );
  
  const cancelledConsultations = consultations.filter(c => 
    c.status === 'cancelled'
  );
  
  useEffect(() => {
    const fetchConsultations = async () => {
      if (!profileId) return;
      
      setIsLoading(true);
      
      try {
        // Define the field to filter by based on the user's role
        const filterField = filterRole === "doctor" ? "doctor_id" : 
                          filterRole === "patient" ? "patient_id" : 
                          filterRole === "pharmacist" ? "doctor_id" : "patient_id";
        
        // Fetch teleconsultations
        const { data, error } = await supabase
          .from('teleconsultations')
          .select(`
            *,
            patient:profiles!teleconsultations_patient_id_fkey(full_name, email),
            doctor:profiles!teleconsultations_doctor_id_fkey(full_name, email)
          `)
          .eq(filterField, profileId)
          .order('start_time', { ascending: true });
          
        if (error) throw error;
        
        // Filter out records where patient or doctor might be null or have an error
        const validConsultations = (data || []).filter(consultation => {
          // Properly check if patient data is valid
          const hasValidPatient = consultation.patient !== null && 
                                 consultation.patient !== undefined && 
                                 typeof consultation.patient === 'object' && 
                                 !('error' in (consultation.patient as object));
                                  
          // Properly check if doctor data is valid
          const hasValidDoctor = consultation.doctor !== null && 
                                consultation.doctor !== undefined && 
                                typeof consultation.doctor === 'object' && 
                                !('error' in (consultation.doctor as object));
                                 
          return hasValidPatient && hasValidDoctor;
        });
        
        // Create properly typed objects from filtered data
        const typedConsultations: Teleconsultation[] = validConsultations.map(consultation => {
          // Default values for patient data
          const defaultPatientData = { full_name: 'Unknown Patient', email: null };
          
          // Extract patient data safely with proper null checks
          const patientData = (() => {
            if (!consultation.patient) return defaultPatientData;
            
            const patientObj = consultation.patient as Record<string, any>;
            
            return {
              full_name: typeof patientObj === 'object' && 
                        'full_name' in patientObj &&
                        patientObj.full_name !== null
                ? patientObj.full_name 
                : 'Unknown Patient',
              email: typeof patientObj === 'object' && 
                    'email' in patientObj
                ? patientObj.email
                : null
            };
          })();
          
          // Default values for doctor data
          const defaultDoctorData = { full_name: 'Unknown Doctor', email: null };
          
          // Extract doctor data safely with proper null checks
          const doctorData = (() => {
            if (!consultation.doctor) return defaultDoctorData;
            
            const doctorObj = consultation.doctor as Record<string, any>;
            
            return {
              full_name: typeof doctorObj === 'object' && 
                        'full_name' in doctorObj &&
                        doctorObj.full_name !== null
                ? doctorObj.full_name 
                : 'Unknown Doctor',
              email: typeof doctorObj === 'object' && 
                    'email' in doctorObj
                ? doctorObj.email 
                : null
            };
          })();
          
          return {
            id: consultation.id,
            patient_id: consultation.patient_id,
            doctor_id: consultation.doctor_id,
            start_time: consultation.start_time,
            end_time: consultation.end_time,
            status: consultation.status,
            reason: consultation.reason,
            room_id: consultation.room_id,
            created_at: consultation.created_at,
            updated_at: consultation.updated_at,
            patient: patientData,
            doctor: doctorData
          };
        });
        
        setConsultations(typedConsultations);
        
        // Check if user has connections (for patients only)
        const checkConnections = async (userRole: string, userId: string) => {
          if (userRole === 'patient') {
            const { count, error: connectionError } = await supabase
              .from('doctor_patient_connections')
              .select('*', { count: 'exact', head: true })
              .eq('patient_id', userId)
              .eq('status', 'accepted');
            
            if (connectionError) throw connectionError;
            
            setHasConnections(count !== null && count > 0);
          } else {
            // Doctors and pharmacists always have connections set to true
            setHasConnections(true);
          }
        };
        
        // Check connections for patient role
        if (filterRole) {
          checkConnections(filterRole, profileId);
        }
      } catch (err) {
        console.error('Error fetching teleconsultations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConsultations();
  }, [profileId, filterRole]);
  
  return {
    isLoading,
    hasConnections,
    consultations,
    todayConsultations,
    upcomingConsultations,
    pastConsultations,
    pendingConsultations,
    cancelledConsultations
  };
};
