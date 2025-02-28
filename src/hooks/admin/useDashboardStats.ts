
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  total_patients: number;
  pending_orders: number;
  monthly_revenue: number;
  total_prescriptions: number;
}

export const usePharmacyDashboardStats = () => {
  return useQuery({
    queryKey: ['pharmacy', 'dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Here we would ideally have a database function to get pharmacy-specific stats
      // For now, we're making multiple queries
      
      try {
        // Count total patients (this would be filtered by pharmacy in a real implementation)
        const { count: patientsCount, error: patientsError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'patient');
          
        if (patientsError) throw patientsError;
        
        // Count pending orders
        const { count: ordersCount, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
          
        if (ordersError) throw ordersError;
        
        // Calculate monthly revenue
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const { data: revenueData, error: revenueError } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', firstDayOfMonth.toISOString())
          .eq('status', 'completed');
          
        if (revenueError) throw revenueError;
        
        const monthlyRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total), 0) || 0;
        
        // Count prescriptions
        const { count: prescriptionsCount, error: prescriptionsError } = await supabase
          .from('prescriptions')
          .select('*', { count: 'exact', head: true });
          
        if (prescriptionsError) throw prescriptionsError;
        
        return {
          total_patients: patientsCount || 0,
          pending_orders: ordersCount || 0,
          monthly_revenue: monthlyRevenue,
          total_prescriptions: prescriptionsCount || 0
        };
      } catch (error) {
        console.error('Error fetching pharmacy dashboard stats:', error);
        // Return default values if there's an error
        return {
          total_patients: 0,
          pending_orders: 0,
          monthly_revenue: 0,
          total_prescriptions: 0
        };
      }
    },
    // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};
