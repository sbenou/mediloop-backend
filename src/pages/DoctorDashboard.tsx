
import React, { useEffect } from "react";
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
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";
import ConsultationsLoading from "@/components/teleconsultation/ConsultationsLoading";
import { checkDashboardAccess } from "@/services/authRedirectService";

interface DoctorDashboardProps {
  initialParams?: URLSearchParams;
}

const DoctorDashboard = ({ initialParams }: DoctorDashboardProps) => {
  const [searchParamsFromUrl] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const auth = useRecoilValue(authState);
  
  // Use initialParams if provided, otherwise use URL params
  const searchParams = initialParams || searchParamsFromUrl;
  
  // Get parameters from URL
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  
  // Enhanced logging for debugging purposes
  console.log('DoctorDashboard render:', {
    isAuthenticated,
    isLoading,
    userRole,
    profileRole: auth.profile?.role,
    isDoctor: auth.profile?.role === 'doctor',
    section,
    profileTab
  });
  
  // Handle authentication and authorization with the centralized service
  useEffect(() => {
    if (!isLoading) {
      checkDashboardAccess(isAuthenticated, userRole, 'doctor', navigate);
    }
  }, [isAuthenticated, isLoading, userRole, navigate]);
  
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
  if (isLoading || !auth.profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RoleDebugger />
        <ConsultationsLoading />
      </div>
    );
  }
  
  // If not authenticated or not a doctor, don't render content
  // The useEffect will handle the redirect
  if (!isAuthenticated || auth.profile?.role !== 'doctor') {
    return null;
  }
  
  // If we reach here, user is authenticated and is a doctor
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
