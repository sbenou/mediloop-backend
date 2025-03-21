
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
import { toast } from "@/components/ui/use-toast";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectAttempted = useRef(false);
  
  // Store whether we've ever displayed content
  const hasShownContentBefore = useRef(false);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  // If we've already shown content, don't go back to showing loading state
  if (hasShownContentBefore.current && isAuthenticated && userRole === "doctor") {
    return (
      <DoctorLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
            {getContent()}
          </ScrollArea>
        </div>
      </DoctorLayout>
    );
  }
  
  // Set URL params on initial load if initialParams was provided
  useEffect(() => {
    if (initialParams && !isLoading) {
      console.log("Setting initial params from props:", Object.fromEntries(initialParams.entries()));
      setSearchParams(initialParams);
    }
  }, [initialParams, isLoading, setSearchParams]);
  
  // Console logging for debugging
  useEffect(() => {
    console.log("DoctorDashboard render:", { 
      userRole, 
      currentView, 
      section,
      profileTab,
      searchParams: Object.fromEntries(searchParams.entries()),
      location: location.pathname + location.search,
      hasInitialParams: !!initialParams,
      isLoading,
      isAuthenticated,
      hasShownContentBefore: hasShownContentBefore.current
    });
  }, [userRole, currentView, section, profileTab, searchParams, location, initialParams, isLoading, isAuthenticated]);
  
  // Make sure we have a default section for doctors
  useEffect(() => {
    if (userRole === "doctor" && !isLoading && isAuthenticated) {
      console.log("Checking doctor params:", { currentView, section });
      
      if (currentView !== 'doctor' || !section) {
        console.log("Setting default doctor params");
        setSearchParams({ view: 'doctor', section: 'dashboard' }, { replace: true });
      }
    }
  }, [userRole, setSearchParams, currentView, section, isLoading, isAuthenticated]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true;
      setIsRedirecting(true);
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
      setIsRedirecting(true);
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, userRole]);

  // Once we've shown content, remember it
  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole === "doctor") {
      // Mark that we've shown content at least once
      hasShownContentBefore.current = true;
    }
  }, [isLoading, isAuthenticated, userRole]);
  
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
  
  // Show a single unified loading state - but only if we haven't shown content before
  if (isLoading || isRedirecting || !isAuthenticated || (isAuthenticated && userRole !== "doctor")) {
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
