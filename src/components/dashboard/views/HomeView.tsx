
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card } from "@/components/ui/card";
import { StatisticsCharts } from "@/components/dashboard/StatisticsCharts";
import WearableDataDisplay from "@/components/dashboard/WearableDataDisplay";
import HealthStateIndicator from "@/components/dashboard/HealthStateIndicator";
import DashboardStats from "@/components/dashboard/views/pharmacy/DashboardStats";
import { usePharmacyDashboardStats } from "@/hooks/admin/useDashboardStats";

interface HomeViewProps {
  userRole: string | null;
}

const HomeView: React.FC<HomeViewProps> = ({ userRole }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  // Fetch stats data for the dashboard
  const { data: statsData, isLoading: isStatsLoading } = usePharmacyDashboardStats();

  const handleViewChange = (view: string, tab?: string) => {
    if (tab) {
      navigate(`/dashboard?view=${view}&${view}Tab=${tab}`);
    } else {
      navigate(`/dashboard?view=${view}`);
    }
  };

  // Role-specific greeting and card data
  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'patient':
        return {
          greeting: "Here's an overview of your healthcare information"
        };
      case 'doctor':
        return {
          greeting: "Here's an overview of your practice"
        };
      case 'pharmacist':
        return {
          greeting: "Here's an overview of your pharmacy operations"
        };
      case 'superadmin':
        return {
          greeting: "Platform administration overview"
        };
      default:
        return {
          greeting: "Welcome to your dashboard"
        };
    }
  };

  const content = getRoleSpecificContent();
  
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.full_name || 'User'}</h1>
        <p className="text-muted-foreground">
          {content.greeting}
        </p>
      </div>
      
      {/* Dashboard Stats with sparklines */}
      <DashboardStats 
        stats={{
          total_patients: statsData?.total_patients || 0,
          pending_orders: statsData?.pending_orders || 0,
          total_prescriptions: statsData?.total_prescriptions || 0,
          monthly_revenue: statsData?.monthly_revenue || 0
        }}
        isLoading={isStatsLoading}
        onNavigate={handleViewChange}
      />
      
      {/* Health State Indicators for patient and doctor roles */}
      <HealthStateIndicator userRole={userRole} />
      
      {/* Wearable Data Display for patient and doctor roles */}
      <WearableDataDisplay userRole={userRole} />
      
      {/* Add statistics charts for all roles */}
      <StatisticsCharts />
    </div>
  );
};

export default HomeView;
