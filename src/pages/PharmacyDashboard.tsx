
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { toast } from "@/components/ui/use-toast";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";
import ConsultationsLoading from "@/components/teleconsultation/ConsultationsLoading";

interface PharmacyDashboardProps {
  initialParams?: URLSearchParams;
}

const PharmacyDashboard = ({ initialParams }: PharmacyDashboardProps) => {
  const [searchParamsFromUrl] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const [showContent, setShowContent] = useState(false);
  
  // Use initialParams if provided, otherwise use URL params
  const searchParams = initialParams || searchParamsFromUrl;
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Enhanced logging for debugging purposes
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    profileRole: auth.profile?.role,
    isPharmacist: auth.profile?.role === 'pharmacist'
  });

  useEffect(() => {
    // If not authenticated and not currently loading, redirect to login
    if (!isAuthenticated && !isLoading) {
      console.log('Not authenticated, redirecting to login');
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
      return;
    }
    
    // If authenticated but not a pharmacist, redirect to dashboard
    if (isAuthenticated && !isLoading && auth.profile && auth.profile.role !== 'pharmacist') {
      console.log('Not a pharmacist, redirecting to dashboard');
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
      return;
    }
    
    // If authenticated and is a pharmacist, show content
    if (isAuthenticated && !isLoading && auth.profile?.role === 'pharmacist') {
      console.log('Showing pharmacy content - user is a pharmacist');
      setShowContent(true);
    }
  }, [isAuthenticated, isLoading, auth.profile, navigate]);

  // If content should be visible, show the dashboard
  if (showContent) {
    return (
      <PharmacistLayout>
        <RoleDebugger />
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={auth.profile?.role || 'pharmacist'} section={section} />
        </div>
      </PharmacistLayout>
    );
  }
  
  // Show loading state or redirect (handled by useEffect)
  return (
    <div className="flex h-screen items-center justify-center">
      <RoleDebugger />
      <ConsultationsLoading />
    </div>
  );
};

export default PharmacyDashboard;
