
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
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  
  // Tracking refs
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const authReady = useRef(false);
  
  // Get parameters from URL or use initialParams if provided
  const currentView = searchParams.get("view") || initialParams?.get("view") || "doctor";
  const section = searchParams.get("section") || initialParams?.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || initialParams?.get("profileTab") || "personal";
  
  // Enhanced logging for debugging purposes
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    profileLoaded: !!auth.profile,
    profileRole: auth.profile?.role,
    isDoctor: auth.profile?.role === 'doctor',
    visibleContent,
    authReady: authReady.current,
    recoilUser: !!auth.user,
    recoilProfile: !!auth.profile
  });
  
  // Define getContent function
  const getContent = () => {
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
      case "dashboard":
      default:
        return <HomeView userRole="doctor" />;
    }
  };
  
  // Mark authentication as ready once auth state is definitive (with profile)
  useEffect(() => {
    if (!authReady.current && !isLoading) {
      if (isAuthenticated && auth.profile) {
        // Auth is ready with profile - this is the definitive state we need
        console.log("Auth is ready with profile:", { 
          isAuthenticated, 
          role: auth.profile.role 
        });
        authReady.current = true;
      } else if (!isAuthenticated && !auth.user) {
        // Auth is definitely not authenticated
        console.log("Auth is ready - user is not authenticated");
        authReady.current = true;
      }
    }
  }, [isLoading, isAuthenticated, auth.profile, auth.user]);
  
  // Set URL params on initial load if initialParams was provided
  useEffect(() => {
    if (initialParams && !isLoading) {
      console.log("Setting initial params from props:", Object.fromEntries(initialParams.entries()));
      setSearchParams(initialParams);
    }
  }, [initialParams, isLoading, setSearchParams]);
  
  // Make sure we have a default section for doctors
  useEffect(() => {
    if (authReady.current && isAuthenticated && auth.profile?.role === 'doctor') {
      console.log("Checking doctor params:", { currentView, section });
      
      if (currentView !== 'doctor' || !section) {
        console.log("Setting default doctor params");
        setSearchParams({ view: 'doctor', section: 'dashboard' }, { replace: true });
      }
    }
  }, [authReady.current, setSearchParams, currentView, section, isAuthenticated, auth.profile]);
  
  // Show content or redirect based on auth state
  useEffect(() => {
    // Only proceed if auth state is ready
    if (!authReady.current) {
      if (visibleContent !== 'loading' && !isLoading) {
        setVisibleContent('loading');
      }
      return;
    }

    // If we've already shown content or attempted redirect, don't do it again
    if (firstContentShown.current || redirectAttempted.current) {
      return;
    }

    // Handle not authenticated case
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the doctor dashboard.",
      });
      navigate("/login");
      return;
    }
    
    // Handle not a doctor case - this is critical
    if (isAuthenticated && auth.profile && auth.profile.role !== 'doctor') {
      console.log('Not a doctor, redirecting to dashboard');
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only doctors can access this dashboard.",
      });
      navigate("/dashboard");
      return;
    }

    // If we reach here and auth is ready with a doctor role, show content
    if (isAuthenticated && auth.profile?.role === 'doctor') {
      console.log('Showing doctor dashboard content - user is a doctor');
      firstContentShown.current = true;
      setVisibleContent('content');
    }
  }, [
    isAuthenticated, navigate, auth.profile, authReady.current, isLoading, 
    redirectAttempted.current, firstContentShown.current, visibleContent
  ]);
  
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
