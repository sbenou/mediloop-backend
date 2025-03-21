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
import { toast } from "@/components/ui/use-toast";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile } = useAuth();
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const initialRenderComplete = useRef(false);
  const stableAuthStateReceived = useRef(false);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    userRole,
    visibleContent: visibleContent,
    firstContentShown: firstContentShown.current,
    initialRender: initialRenderComplete.current,
    stableAuthState: stableAuthStateReceived.current
  });
  
  // Define getContent function
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
  
  // Mark initial render as complete after a brief delay
  useEffect(() => {
    if (!initialRenderComplete.current) {
      const timer = setTimeout(() => {
        initialRenderComplete.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Set URL params on initial load if initialParams was provided
  useEffect(() => {
    if (initialParams && !isLoading) {
      console.log("Setting initial params from props:", Object.fromEntries(initialParams.entries()));
      setSearchParams(initialParams);
    }
  }, [initialParams, isLoading, setSearchParams]);
  
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
  
  // Set content to be visible once authenticated
  useEffect(() => {
    // Once stable auth state is received, we can make decisions
    if (!isLoading) {
      stableAuthStateReceived.current = true;
    }
    
    // If we've shown content before, keep showing it regardless of auth state changes
    if (firstContentShown.current) {
      if (visibleContent !== 'content') {
        setVisibleContent('content');
      }
      return;
    }
    
    // Only change to content if authenticated and appropriate role
    if (stableAuthStateReceived.current && isAuthenticated && userRole === "doctor") {
      firstContentShown.current = true;
      setVisibleContent('content');
      console.log('Dashboard content shown - marking as visible permanently');
    } 
    // Only show loading if we're past initial render and have a stable auth state
    else if (stableAuthStateReceived.current && initialRenderComplete.current && visibleContent === 'initial') {
      setVisibleContent('loading');
    }
  }, [isLoading, isAuthenticated, userRole, visibleContent, stableAuthStateReceived]);
  
  // Redirect to login if not authenticated - but only after initial loading and if we've never shown content
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !stableAuthStateReceived.current) {
      return;
    }
    
    // Only redirect if we're sure authentication has failed (not just loading)
    if (!isLoading && initialRenderComplete.current && !isAuthenticated) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate, initialRenderComplete, stableAuthStateReceived]);
  
  // Redirect to regular dashboard if not a doctor - but only after initial loading and if we've never shown content
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !stableAuthStateReceived.current) {
      return;
    }
    
    // Only redirect if we're sure user is not a doctor (not just loading)
    if (!isLoading && initialRenderComplete.current && isAuthenticated && userRole !== "doctor") {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, userRole, initialRenderComplete, stableAuthStateReceived]);
  
  // If content is designated to be visible, always show the dashboard
  if (visibleContent === 'content') {
    return (
      <DoctorLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          {getContent()}
        </div>
      </DoctorLayout>
    );
  }
  
  // Show loading state
  if (visibleContent === 'loading' || visibleContent === 'initial') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Fallback (should not reach here)
  return null;
};

export default DoctorDashboard;
