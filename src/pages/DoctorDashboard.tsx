
import React, { useState, useEffect } from "react";
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
import ConsultationsLoading from "@/components/teleconsultation/ConsultationsLoading";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps) => {
  const [searchParamsFromUrl] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const [isPageReady, setIsPageReady] = useState(false);
  
  // Use initialParams if provided, otherwise use URL params
  const searchParams = initialParams || searchParamsFromUrl;
  
  // Get parameters from URL
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  
  // Enhanced logging for debugging purposes
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    profileRole: auth.profile?.role,
    isDoctor: auth.profile?.role === 'doctor'
  });
  
  useEffect(() => {
    // Only proceed when auth state is confirmed (not loading)
    if (!isLoading) {
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        console.log('Not authenticated, redirecting to login');
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please login to access the doctor dashboard.",
        });
        navigate("/login");
        return;
      }
      
      // If authenticated but not a doctor, redirect to dashboard
      if (isAuthenticated && auth.profile && auth.profile.role !== 'doctor') {
        console.log('Not a doctor, redirecting to dashboard');
        toast({
          title: "Access restricted",
          description: "Only doctors can access this dashboard.",
        });
        navigate("/dashboard");
        return;
      }
      
      // If authenticated and is a doctor, show content
      if (isAuthenticated && auth.profile?.role === 'doctor') {
        console.log('Showing doctor content - user is a doctor');
        setIsPageReady(true);
      }
    }
  }, [isAuthenticated, isLoading, auth.profile, navigate]);
  
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
  
  // Show loading state while auth is being verified
  if (isLoading || !isPageReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RoleDebugger />
        <ConsultationsLoading />
      </div>
    );
  }
  
  // If we reach here, content should be displayed
  return (
    <DoctorLayout>
      <RoleDebugger />
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        {getContent()}
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
