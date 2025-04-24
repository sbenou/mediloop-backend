
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DoctorStats {
  total_patients: number;
  active_teleconsultations: number;
  active_consultations: number;
  active_prescriptions: number;
  patient_trend?: Array<{ value: number }>;
  percent_change: number;
}

export const useDoctorStats = (doctorId?: string) => {
  return useQuery({
    queryKey: ['doctor', 'stats', doctorId],
    queryFn: async (): Promise<DoctorStats> => {
      if (!doctorId) throw new Error('Doctor ID is required');

      // Get total patients through connections
      const { count: patientsCount, error: patientsError } = await supabase
        .from('doctor_patient_connections')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'accepted');

      if (patientsError) throw patientsError;

      // Get active teleconsultations
      const { count: teleCount, error: teleError } = await supabase
        .from('teleconsultations')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .in('status', ['pending', 'confirmed']);

      if (teleError) throw teleError;

      // Get active consultations (if we had a consultations table)
      // For now, this will be 0 until we implement consultations

      // Get active prescriptions
      const { count: prescriptionsCount, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId);

      if (prescriptionsError) throw prescriptionsError;

      // Calculate patient growth (last month vs previous month)
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      const { count: lastMonthCount, error: lastMonthError } = await supabase
        .from('doctor_patient_connections')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'accepted')
        .gte('created_at', oneMonthAgo.toISOString())
        .lt('created_at', now.toISOString());

      const { count: previousMonthCount, error: previousMonthError } = await supabase
        .from('doctor_patient_connections')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .eq('status', 'accepted')
        .gte('created_at', twoMonthsAgo.toISOString())
        .lt('created_at', oneMonthAgo.toISOString());

      if (lastMonthError || previousMonthError) {
        throw lastMonthError || previousMonthError;
      }

      // Calculate percent change
      const percentChange = previousMonthCount ? 
        ((lastMonthCount - previousMonthCount) / previousMonthCount) * 100 : 
        0;

      return {
        total_patients: patientsCount || 0,
        active_teleconsultations: teleCount || 0,
        active_consultations: 0, // This would need a consultations table
        active_prescriptions: prescriptionsCount || 0,
        percent_change: Number(percentChange.toFixed(1))
      };
    },
    enabled: !!doctorId
  });
};
