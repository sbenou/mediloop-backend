
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShoppingBag, FileText } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    total_patients?: number;
    pending_orders?: number;
    total_prescriptions?: number;
    monthly_revenue?: number;
  } | null;
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading, onNavigate }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate('patients')}
      >
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
      
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate('orders')}
      >
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
      
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate('prescriptions')}
      >
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
  );
};

export default DashboardStats;
