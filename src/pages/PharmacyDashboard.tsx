
import { useEffect } from "react";
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
    section
  });

  // Handle authentication and authorization with the centralized service
  useEffect(() => {
    if (!isLoading) {
      checkDashboardAccess(isAuthenticated, userRole, 'pharmacist', navigate);
    }
  }, [isAuthenticated, isLoading, userRole, navigate]);

  // Show loading state while auth is being verified
  if (isLoading || !auth.profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RoleDebugger />
        <ConsultationsLoading />
      </div>
    );
  }
  
  // If not authenticated or not a pharmacist, don't render content
  // The useEffect will handle the redirect
  if (!isAuthenticated || auth.profile?.role !== 'pharmacist') {
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
