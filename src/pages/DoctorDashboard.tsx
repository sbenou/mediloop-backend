
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps) => {
  const [searchParamsFromUrl] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const [showContent, setShowContent] = useState(false);
  
  // Use initialParams if provided, otherwise use URL params
  const searchParams = initialParams || searchParamsFromUrl;
  
  // Tracking refs to prevent duplicate actions
  const redirectAttempted = useRef(false);
  const contentShown = useRef(false);
  
  // Get parameters from URL
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  
  // Enhanced logging for debugging purposes
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    profileRole: auth.profile?.role,
    isDoctor: auth.profile?.role === 'doctor',
    showContent,
    contentShownRef: contentShown.current,
    redirectRef: redirectAttempted.current
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
  
  // Handle showing content or redirect based on auth state
  useEffect(() => {
    // Only take action when auth is ready (not loading)
    if (!isLoading) {
      // Handle not authenticated case
      if (!isAuthenticated && !redirectAttempted.current) {
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
      
      // Handle wrong role case
      if (isAuthenticated && auth.profile && auth.profile.role !== 'doctor' && !redirectAttempted.current) {
        console.log('Not a doctor, redirecting to dashboard');
        redirectAttempted.current = true;
        toast({
          title: "Access restricted",
          description: "Only doctors can access this dashboard.",
        });
        navigate("/dashboard");
        return;
      }
      
      // Show content if authenticated with doctor role
      if (isAuthenticated && auth.profile?.role === 'doctor' && !contentShown.current) {
        console.log('Showing doctor content - user is a doctor');
        contentShown.current = true;
        setShowContent(true);
      }
    }
  }, [isAuthenticated, isLoading, auth.profile, navigate]);
  
  // If content should be visible, show the dashboard
  if (showContent) {
    return (
      <DoctorLayout>
        <RoleDebugger />
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          {getContent()}
        </div>
      </DoctorLayout>
    );
  }
  
  // Show standardized loading state
  return (
    <div className="flex h-screen items-center justify-center">
      <RoleDebugger />
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default DoctorDashboard;
