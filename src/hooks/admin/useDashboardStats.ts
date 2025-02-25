
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  total_products: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase
        .rpc('get_admin_dashboard_stats');
      
      if (error) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error(error.message);
      }
      
      return data || {
        total_users: 0,
        total_roles: 0,
        total_permissions: 0,
        total_products: 0
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
