
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  total_patients: number;
  pending_orders: number;
  monthly_revenue: number;
  total_prescriptions: number;
}

interface AdminDashboardStats {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  total_products: number;
}

// Hook for admin dashboard stats
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async (): Promise<AdminDashboardStats> => {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_dashboard_stats');

        if (error) throw error;
        
        return {
          total_users: data?.[0]?.total_users || 0,
          total_roles: data?.[0]?.total_roles || 0,
          total_permissions: data?.[0]?.total_permissions || 0,
          total_products: data?.[0]?.total_products || 0
        };
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        return {
          total_users: 0,
          total_roles: 0,
          total_permissions: 0,
          total_products: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for pharmacy dashboard stats
export const usePharmacyDashboardStats = () => {
  return useQuery({
    queryKey: ['pharmacy', 'dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
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
        
        // Calculate monthly revenue - use delivered instead of completed which isn't in the enum
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const { data: revenueData, error: revenueError } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', firstDayOfMonth.toISOString())
          .eq('status', 'delivered');
          
        if (revenueError) throw revenueError;
        
        // Correctly type and convert the order total to number
        const monthlyRevenue = revenueData?.reduce((sum, order) => {
          // Ensure total is treated as a number
          const orderTotal = typeof order.total === 'string' 
            ? parseFloat(order.total) 
            : (typeof order.total === 'number' ? order.total : 0);
          return sum + orderTotal;
        }, 0) || 0;
        
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
        return {
          total_patients: 0,
          pending_orders: 0,
          monthly_revenue: 0,
          total_prescriptions: 0
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};
