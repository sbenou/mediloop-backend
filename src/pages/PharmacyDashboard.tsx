
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";
import ConsultationsLoading from "@/components/teleconsultation/ConsultationsLoading";
import { checkDashboardAccess } from "@/services/authRedirectService";

interface PharmacyDashboardProps {
  initialParams?: URLSearchParams;
}

const PharmacyDashboard = ({ initialParams }: PharmacyDashboardProps) => {
  const [searchParamsFromUrl] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, userRole } = useAuth();
  const auth = useRecoilValue(authState);
  const [accessChecked, setAccessChecked] = useState(false);
  
  // Use initialParams if provided, otherwise use URL params
  const searchParams = initialParams || searchParamsFromUrl;
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Enhanced logging for debugging purposes
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    userRole,
    profileRole: auth.profile?.role,
    isPharmacist: auth.profile?.role === 'pharmacist',
    section,
    accessChecked
  });

  // Handle authentication and authorization with the centralized service
  useEffect(() => {
    // Only check access when auth state is loaded
    if (!isLoading) {
      const hasAccess = checkDashboardAccess(isAuthenticated, userRole, 'pharmacist', navigate);
      setAccessChecked(true);
      
      console.log('Access check result:', hasAccess ? 'User has access' : 'User does not have access');
    }
  }, [isAuthenticated, isLoading, userRole, navigate]);

  // Show loading state while auth is being verified
  if (isLoading || (isAuthenticated && !auth.profile)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RoleDebugger />
        <div className="flex flex-col items-center justify-center">
          <ConsultationsLoading />
          <p className="mt-4 text-lg">Loading pharmacy dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If access check completed and user is not authenticated or not a pharmacist,
  // don't render content - the useEffect redirect will handle navigation
  if (accessChecked && (!isAuthenticated || userRole !== 'pharmacist')) {
    return null;
  }
  
  // If we reach here, user is authenticated and is a pharmacist
  return (
    <PharmacistLayout>
      <RoleDebugger />
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <PharmacyView userRole={auth.profile?.role || 'pharmacist'} section={section} />
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
