
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ProfileView, 
  SettingsView,
  HomeView,
  WorkplacesView,
  OrdersView
} from "@/components/dashboard/views";
import DoctorPatientView from "@/components/dashboard/views/doctor/DoctorPatientView";
import DoctorPrescriptionsView from "@/components/dashboard/views/doctor/DoctorPrescriptionsView";
import DoctorTeleconsultationsView from "@/components/dashboard/views/doctor/DoctorTeleconsultationsView";
import DoctorAppointmentsView from "@/components/dashboard/views/doctor/DoctorAppointmentsView";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import { setPreferredDashboardMode } from "@/utils/dashboard/dashboardMode";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isLoading, userRole } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || initialParams?.get("ordersTab") || "orders";
  const workplacesTab = searchParams.get("workplacesTab") || initialParams?.get("workplacesTab") || "selection";
  const patientModeParam = searchParams.get("mode") === "patient";
  
  // Set URL params on initial load if initialParams was provided
  useEffect(() => {
    if (initialParams && isInitialLoad && !isLoading) {
      setSearchParams(initialParams);
    }
  }, [initialParams, isInitialLoad, isLoading, setSearchParams]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
    }
  }, [isLoading]);
  
  // Prevent unmounting if the userRole isn't 'doctor'
  // This check allows the component to remain mounted even if auth state isn't fully loaded yet
  const shouldRender = !isLoading || isInitialLoad || userRole === 'doctor' || userRole === 'superadmin';
  
  if (!shouldRender) {
    return null;
  }
  
  const getContent = () => {
    if (patientModeParam) {
      // Reuse the existing patient dashboard views with doctor auth context.
      return <DashboardRouter userRole="doctor" forcePatientView />;
    }

    // For the doctor dashboard, show content based on the section
    switch (section) {
      case "profile":
        return <ProfileView activeTab={profileTab} userRole="doctor" />;
      case "settings":
        return <SettingsView userRole="doctor" />;
      case "prescriptions":
        return <DoctorPrescriptionsView />;
      case "patients":
        return <DoctorPatientView />;
      case "teleconsultations":
        return <DoctorTeleconsultationsView />;
      case "appointments":
        return <DoctorAppointmentsView />;
      case "workplaces":
        return <WorkplacesView />;
      case "orders":
        return <OrdersView activeTab={ordersTab} userRole={userRole || "doctor"} />;
      case "dashboard":
      default:
        return <HomeView userRole="doctor" />;
    }
  };

  const togglePatientDashboardMode = () => {
    const next = new URLSearchParams(searchParams);
    const nextMode = patientModeParam ? "role" : "patient";
    if (patientModeParam) {
      next.delete("mode");
    } else {
      next.set("mode", "patient");
      if (!next.get("view")) {
        next.set("view", "home");
      }
    }
    setPreferredDashboardMode("doctor", nextMode);
    setSearchParams(next, { replace: true });
  };
  
  // Show loading skeleton only on initial load, not during navigation
  if (isInitialLoad && isLoading) {
    return (
      <DoctorLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </DoctorLayout>
    );
  }
  
  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant={patientModeParam ? "default" : "outline"}>
            {patientModeParam ? "Patient Dashboard View" : "Doctor Dashboard View"}
          </Badge>
          <Button size="sm" variant="outline" onClick={togglePatientDashboardMode}>
            {patientModeParam ? "Back to doctor dashboard" : "Open patient dashboard"}
          </Button>
        </div>
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          {getContent()}
        </ScrollArea>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
