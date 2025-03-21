
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
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";

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
  
  // Tracking refs
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const authStateReady = useRef(false);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    userRole,
    userRoleDirect: auth.profile?.role,
    visibleContent,
    firstContentShown: firstContentShown.current,
    authStateReady: authStateReady.current,
    profileLoaded: !!auth.profile
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
  
  // CRITICAL: Wait for profile data to be loaded before making decisions
  useEffect(() => {
    // We consider the auth state ready when loading is complete AND
    // either we have a profile (authenticated) or we're definitely not authenticated
    if (!authStateReady.current && !isLoading && (auth.profile || !isAuthenticated)) {
      authStateReady.current = true;
      console.log("Auth state is ready, profile loaded:", !!auth.profile);
    }
  }, [isLoading, isAuthenticated, auth.profile]);
  
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
  
  // Set content visibility once auth state is ready
  useEffect(() => {
    // If content is already shown, keep showing it
    if (firstContentShown.current) {
      if (visibleContent !== 'content') {
        setVisibleContent('content');
      }
      return;
    }
    
    // Only proceed if auth state is ready
    if (!authStateReady.current) {
      if (visibleContent !== 'loading' && !isLoading) {
        setVisibleContent('loading');
      }
      return;
    }

    // Show content if authenticated as a doctor
    if (authStateReady.current && isAuthenticated && auth.profile &&
        (auth.profile.role === 'doctor' || userRole === 'doctor')) {
      console.log('Showing doctor dashboard content - user is a doctor');
      firstContentShown.current = true;
      setVisibleContent('content');
    }
    // Show loading while waiting for auth state
    else if (visibleContent === 'initial' && !isLoading) {
      setVisibleContent('loading');
    }
  }, [
    isLoading, isAuthenticated, userRole,
    visibleContent, auth.profile
  ]);
  
  // Handle redirects when auth state is ready
  useEffect(() => {
    // Only process redirects if auth state is ready and we haven't shown content or attempted redirect
    if (!authStateReady.current || firstContentShown.current || redirectAttempted.current) {
      return;
    }

    // Handle not authenticated case
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the dashboard.",
      });
      navigate("/login");
      return;
    }
    
    // Handle not a doctor case
    if (isAuthenticated && auth.profile && 
        auth.profile.role !== 'doctor' && userRole !== 'doctor') {
      console.log('Not a doctor, redirecting to dashboard');
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, navigate, userRole, auth.profile, authStateReady]);
  
  // If content is designated to be visible, show the dashboard
  if (visibleContent === 'content') {
    return (
      <DoctorLayout>
        <RoleDebugger />
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          {getContent()}
        </div>
      </DoctorLayout>
    );
  }
  
  // Show loading state
  return (
    <div className="flex h-screen items-center justify-center">
      <RoleDebugger />
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default DoctorDashboard;
