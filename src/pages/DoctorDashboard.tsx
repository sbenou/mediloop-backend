
import React, { useEffect, useState } from "react";
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
  const [accessChecked, setAccessChecked] = useState(false);
  
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
    profileTab,
    accessChecked
  });
  
  // Handle authentication and authorization with the centralized service
  useEffect(() => {
    // Only check access when auth state is loaded
    if (!isLoading) {
      const hasAccess = checkDashboardAccess(isAuthenticated, userRole, 'doctor', navigate);
      setAccessChecked(true);
      
      console.log('Access check result:', hasAccess ? 'User has access' : 'User does not have access');
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
  if (isLoading || (isAuthenticated && !auth.profile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RoleDebugger />
        <div className="flex flex-col items-center justify-center">
          <ConsultationsLoading />
          <p className="mt-4 text-lg">Loading doctor dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If access check completed and user is not authenticated or not a doctor,
  // don't render content - the useEffect redirect will handle navigation
  if (accessChecked && (!isAuthenticated || userRole !== 'doctor')) {
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
