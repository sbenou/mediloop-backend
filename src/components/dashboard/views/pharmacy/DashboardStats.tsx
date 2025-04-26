
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  ShoppingBag,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PatientsGoalCard from "./PatientsGoalCard";

interface DashboardStatsProps {
  stats: {
    total_patients?: number;
    pending_orders?: number;
    monthly_revenue?: number;
    total_prescriptions?: number;
  } | null;
  isLoading: boolean;
  onNavigate: (path: string) => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  isLoading,
  onNavigate
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Patients card */}
      <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Active Patients</h3>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-semibold">+{stats?.total_patients || 0}</div>
          )}
          <div className="mt-4">
            <Button 
              variant="ghost" 
              className="h-8 px-2 text-sm text-blue-600 hover:text-blue-800 p-0 hover:bg-transparent"
              onClick={() => onNavigate('patients')}
            >
              View all patients
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Pending Orders card */}
      <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Orders</h3>
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-amber-600" />
          </div>
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-semibold">+{stats?.pending_orders || 0}</div>
          )}
          <div className="mt-4">
            <Button 
              variant="ghost" 
              className="h-8 px-2 text-sm text-amber-600 hover:text-amber-800 p-0 hover:bg-transparent"
              onClick={() => onNavigate('orders')}
            >
              View all orders
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Monthly Revenue card */}
      <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Revenue</h3>
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-semibold">€{stats?.monthly_revenue?.toLocaleString() || 0}</div>
          )}
          <div className="mt-4">
            <Button 
              variant="ghost" 
              className="h-8 px-2 text-sm text-green-600 hover:text-green-800 p-0 hover:bg-transparent"
              onClick={() => onNavigate('orders')}
            >
              View finances
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Prescriptions card */}
      <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Prescriptions</h3>
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-semibold">+{stats?.total_prescriptions || 0}</div>
          )}
          <div className="mt-4">
            <Button 
              variant="ghost" 
              className="h-8 px-2 text-sm text-purple-600 hover:text-purple-800 p-0 hover:bg-transparent"
              onClick={() => onNavigate('prescriptions')}
            >
              View all prescriptions
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;
