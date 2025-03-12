
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface PatientDashboardStats {
  total_prescriptions: number;
  active_teleconsultations: number;
  pending_orders: number;
  completed_payments: number;
}

export const usePatientDashboardStats = () => {
  return useQuery({
    queryKey: ['patient', 'dashboard-stats'],
    queryFn: async (): Promise<PatientDashboardStats> => {
      try {
        // Get the current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("Not authenticated");
        
        // Count prescriptions for this patient
        const { count: prescriptionsCount, error: prescriptionsError } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id);
          
        if (prescriptionsError) throw prescriptionsError;
        
        // Count active teleconsultations
        const { count: teleconsultationsCount, error: teleconsultationsError } = await supabase
          .from('teleconsultations')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.id)
          .in('status', ['pending', 'confirmed']); // Using valid status values
          
        if (teleconsultationsError) throw teleconsultationsError;
        
        // Count pending orders
        const { count: ordersCount, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending');
          
        if (ordersError) throw ordersError;
        
        // Count completed payments (using delivered orders as proxy)
        const { count: paymentsCount, error: paymentsError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'delivered');
          
        if (paymentsError) throw paymentsError;
        
        return {
          total_prescriptions: prescriptionsCount || 0,
          active_teleconsultations: teleconsultationsCount || 0,
          pending_orders: ordersCount || 0,
          completed_payments: paymentsCount || 0
        };
      } catch (error) {
        console.error('Error fetching patient dashboard stats:', error);
        return {
          total_prescriptions: 0,
          active_teleconsultations: 0,
          pending_orders: 0,
          completed_payments: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};
