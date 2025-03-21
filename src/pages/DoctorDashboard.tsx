
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  ProfileView, 
  SettingsView, 
  HomeView
} from "@/components/dashboard/views";
import DoctorPatientView from "@/components/dashboard/views/doctor/DoctorPatientView";
import DoctorPrescriptionsView from "@/components/dashboard/views/doctor/DoctorPrescriptionsView";
import DoctorTeleconsultationsView from "@/components/dashboard/views/doctor/DoctorTeleconsultationsView";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const redirectAttempted = useRef(false);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  // Set URL params on initial load if initialParams was provided
  useEffect(() => {
    if (initialParams && isInitialLoad && !isLoading) {
      console.log("Setting initial params from props:", Object.fromEntries(initialParams.entries()));
      setSearchParams(initialParams);
    }
  }, [initialParams, isInitialLoad, isLoading, setSearchParams]);
  
  // Console logging for debugging
  useEffect(() => {
    console.log("DoctorDashboard render:", { 
      userRole, 
      currentView, 
      section,
      profileTab,
      searchParams: Object.fromEntries(searchParams.entries()),
      location: location.pathname + location.search,
      hasInitialParams: !!initialParams
    });
  }, [userRole, currentView, section, profileTab, searchParams, location, initialParams]);
  
  // Make sure we have a default section for doctors
  useEffect(() => {
    if (userRole === "doctor" && !isInitialLoad && isAuthenticated) {
      console.log("Checking doctor params:", { currentView, section });
      
      if (currentView !== 'doctor' || !section) {
        console.log("Setting default doctor params");
        setSearchParams({ view: 'doctor', section: 'dashboard' }, { replace: true });
      }
    }
  }, [userRole, setSearchParams, currentView, section, isInitialLoad, isAuthenticated]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 300); // Small timeout to prevent flickering
    }
  }, [isLoading]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (after initial load)
    if (!isLoading && !isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Redirect to regular dashboard if not a doctor
  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole !== "doctor" && !redirectAttempted.current) {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, userRole]);
  
  const getContent = () => {
    // For the doctor dashboard, show content based on the section
    switch (section) {
      case "profile":
        return <ProfileView activeTab={profileTab} userRole={userRole} />;
      case "settings":
        return <SettingsView userRole={userRole} />;
      case "prescriptions":
        return <DoctorPrescriptionsView />;
      case "patients":
        return <DoctorPatientView />;
      case "teleconsultations":
        return <DoctorTeleconsultationsView />;
      case "dashboard":
      default:
        return <HomeView userRole={userRole} />;
    }
  };
  
  // If we're still loading or there's a redirect in progress, show the loading state
  if ((isInitialLoad && isLoading) || !isAuthenticated || (isAuthenticated && userRole !== "doctor")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          {getContent()}
        </ScrollArea>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
