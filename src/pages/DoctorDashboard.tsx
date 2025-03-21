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
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile } = useAuth();
  const auth = useRecoilValue(authState);
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const initialRenderComplete = useRef(false);
  const sessionCheckComplete = useRef(false);
  const authStateStable = useRef(false);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    userRole,
    userRoleDirect: auth.profile?.role,
    visibleContent: visibleContent,
    firstContentShown: firstContentShown.current,
    initialRender: initialRenderComplete.current,
    stableAuthState: authStateStable.current,
    sessionCheckComplete: sessionCheckComplete.current
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
  
  // Detect a stable auth state - this needs to happen BEFORE any redirect logic
  useEffect(() => {
    // We have a stable auth state when:
    // 1. isLoading has completed (is false)
    // 2. We have either successfully authenticated or definitely failed
    // 3. If authenticated, we have loaded the profile data
    if (!authStateStable.current && !isLoading) {
      if (!isAuthenticated) {
        // Definitely not authenticated - stable state
        authStateStable.current = true;
        console.log("Auth state stable: Not authenticated");
      } else if (auth.profile) {
        // Authenticated with profile - stable state
        authStateStable.current = true;
        console.log("Auth state stable: Authenticated with profile", auth.profile);
      }
    }
  }, [isLoading, isAuthenticated, auth.profile]);
  
  // After a brief delay, check if the session is complete
  useEffect(() => {
    if (!sessionCheckComplete.current && initialRenderComplete.current) {
      const timer = setTimeout(() => {
        sessionCheckComplete.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialRenderComplete]);
  
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
    // If we've shown content before, always keep showing it
    if (firstContentShown.current) {
      if (visibleContent !== 'content') {
        setVisibleContent('content');
      }
      return;
    }
    
    // Show content if authenticated as a doctor
    if (authStateStable.current && isAuthenticated && 
        (userRole === "doctor" || auth.profile?.role === "doctor")) {
      firstContentShown.current = true;
      setVisibleContent('content');
      console.log('Dashboard content shown - marking as visible permanently');
    } 
    // Show loading if we're past initial render but don't have stable auth yet
    else if (sessionCheckComplete.current && visibleContent === 'initial') {
      setVisibleContent('loading');
    }
  }, [
    isLoading, isAuthenticated, userRole, 
    visibleContent, auth.profile, 
    authStateStable, sessionCheckComplete
  ]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !authStateStable.current) {
      return;
    }
    
    // Only redirect if we're sure authentication has failed
    if (authStateStable.current && !isAuthenticated) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate, authStateStable]);
  
  // Redirect to regular dashboard if not a doctor
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !authStateStable.current) {
      return;
    }
    
    // Only redirect if we're sure user is not a doctor
    if (authStateStable.current && isAuthenticated && 
        userRole !== "doctor" && auth.profile?.role !== "doctor") {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, userRole, authStateStable, auth.profile]);
  
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
