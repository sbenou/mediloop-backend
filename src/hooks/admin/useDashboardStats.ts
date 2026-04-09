
import { useQuery } from "@tanstack/react-query";
import { fetchPharmacyDashboardStatsApi } from "@/services/clinicalApi";
import { fetchAdminDashboardStatsApi } from "@/services/adminPlatformApi";

interface DashboardStats {
  total_patients: number;
  pending_orders: number;
  monthly_revenue: number;
  total_prescriptions: number;
  // We could add trend data here in the future:
  // patient_trend?: Array<{ value: number }>;
  // orders_trend?: Array<{ value: number }>;
  // prescriptions_trend?: Array<{ value: number }>;
  // revenue_trend?: Array<{ value: number }>;
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
        return await fetchAdminDashboardStatsApi();
      } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        return {
          total_users: 0,
          total_roles: 0,
          total_permissions: 0,
          total_products: 0,
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
        return await fetchPharmacyDashboardStatsApi();
      } catch (error) {
        console.error("Error fetching pharmacy dashboard stats:", error);
        return {
          total_patients: 0,
          pending_orders: 0,
          monthly_revenue: 0,
          total_prescriptions: 0,
        };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};
