
import React, { useState, useEffect } from "react";
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
  const [isPageMounted, setIsPageMounted] = useState(true);
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);
  const redirectAttempted = React.useRef(false);
  const dashboardMounted = React.useRef(true);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  // Component lifecycle management
  useEffect(() => {
    console.log("DoctorDashboard component mounted");
    dashboardMounted.current = true;
    setIsPageMounted(true);
    
    return () => {
      console.log("DoctorDashboard component unmounted");
      dashboardMounted.current = false;
      setIsPageMounted(false);
    };
  }, []);
  
  // Set URL params on initial load if initialParams was provided
  useEffect(() => {
    if (initialParams && isInitialLoad && !isLoading && dashboardMounted.current && isPageMounted) {
      console.log("Setting initial params from props:", Object.fromEntries(initialParams.entries()));
      setSearchParams(initialParams);
      
      // Delay setting initialSetupComplete to ensure state updates complete
      setTimeout(() => {
        if (dashboardMounted.current && isPageMounted) {
          setInitialSetupComplete(true);
        }
      }, 100);
    } else if (!initialParams && dashboardMounted.current && isPageMounted) {
      // If no initialParams, we can mark setup as complete immediately
      setInitialSetupComplete(true);
    }
  }, [initialParams, isInitialLoad, isLoading, setSearchParams, isPageMounted]);
  
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
    if (userRole === "doctor" && !isInitialLoad && isAuthenticated && dashboardMounted.current && isPageMounted && initialSetupComplete) {
      console.log("Checking doctor params:", { currentView, section });
      
      if (currentView !== 'doctor' || !section) {
        console.log("Setting default doctor params");
        setSearchParams({ view: 'doctor', section: 'dashboard' }, { replace: true });
      }
    }
  }, [userRole, setSearchParams, currentView, section, isInitialLoad, isAuthenticated, initialSetupComplete, isPageMounted]);
  
  // Track initial load to avoid flashing loading state during navigation
  useEffect(() => {
    if (!isLoading && dashboardMounted.current && isPageMounted) {
      setIsInitialLoad(false);
    }
  }, [isLoading, isPageMounted]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated (after initial load)
    if (!isInitialLoad && !isAuthenticated && !redirectAttempted.current && dashboardMounted.current && isPageMounted) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isInitialLoad, navigate, isPageMounted]);
  
  // Redirect to regular dashboard if not a doctor
  useEffect(() => {
    if (!isInitialLoad && isAuthenticated && userRole !== "doctor" && !redirectAttempted.current && dashboardMounted.current && isPageMounted) {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isInitialLoad, navigate, userRole, isPageMounted]);
  
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
  
  // Security check - only render if authenticated and a doctor
  if (!isAuthenticated || userRole !== "doctor") {
    return null;
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
