
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import { usePharmacyDashboardStats } from "@/hooks/admin/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  ShoppingBag, 
  FileText
} from "lucide-react";

interface PharmacyViewProps {
  userRole: string | null;
}

const PharmacyView: React.FC<PharmacyViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = usePharmacyDashboardStats();

  const navigateToPharmacyPage = (path: string) => {
    navigate(`/pharmacy/${path}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || 'Pharmacy Staff'}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToPharmacyPage('patients')}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Patients</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">+{stats?.total_patients || 0}</div>
            )}
          </div>
        </Card>
        
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToPharmacyPage('orders')}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Pending Orders</h3>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">+{stats?.pending_orders || 0}</div>
            )}
          </div>
        </Card>
        
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigateToPharmacyPage('prescriptions')}>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Prescriptions</h3>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">+{stats?.total_prescriptions || 0}</div>
            )}
          </div>
        </Card>
        
        <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Monthly Revenue</h3>
            <span className="text-muted-foreground">€</span>
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">€{stats?.monthly_revenue?.toLocaleString() || 0}</div>
            )}
          </div>
        </Card>
      </div>
      
      {/* Add statistics charts */}
      <StatisticsCharts />
    </div>
  );
};

export default PharmacyView;
