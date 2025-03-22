
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { toast } from "@/components/ui/use-toast";
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";
import { Skeleton } from "@/components/ui/skeleton";
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
  
  // Tracking refs to prevent duplicate actions
  const redirectAttempted = useRef(false);
  const contentShown = useRef(false);
  const authCheckComplete = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Enhanced logging for debugging purposes
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    profileRole: auth.profile?.role,
    isPharmacist: auth.profile?.role === 'pharmacist',
    showContent,
    contentShownRef: contentShown.current,
    redirectRef: redirectAttempted.current,
    authCheckCompleteRef: authCheckComplete.current,
    authStateIsLoading: auth.isLoading
  });

  // Reset refs when auth loading state changes to completed
  useEffect(() => {
    if (!isLoading && authCheckComplete.current === false) {
      authCheckComplete.current = true;
      
      // Now that auth is ready, we can make access control decisions
      handleAccessControl();
    }
  }, [isLoading]);
  
  // Separate function to handle access control logic
  const handleAccessControl = () => {
    if (!isAuthenticated && !redirectAttempted.current) {
      console.log('Not authenticated, redirecting to login');
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
      return;
    }
    
    if (isAuthenticated && auth.profile && auth.profile.role !== 'pharmacist' && !redirectAttempted.current) {
      console.log('Not a pharmacist, redirecting to dashboard');
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
      return;
    }
    
    if (isAuthenticated && auth.profile?.role === 'pharmacist' && !contentShown.current) {
      console.log('Showing pharmacy content - user is a pharmacist');
      contentShown.current = true;
      setShowContent(true);
    }
  };
  
  // Handle profile changes separately
  useEffect(() => {
    if (auth.profile) {
      console.log('Profile loaded, role:', auth.profile.role);
      
      if (auth.profile.role === 'pharmacist' && !contentShown.current) {
        console.log('Profile confirmed as pharmacist, showing content');
        contentShown.current = true;
        setShowContent(true);
      } else if (auth.profile.role !== 'pharmacist' && !redirectAttempted.current) {
        console.log('Profile is not pharmacist, redirecting');
        redirectAttempted.current = true;
        toast({
          title: "Access restricted",
          description: "Only pharmacists can access this dashboard.",
        });
        navigate("/dashboard");
      }
    }
  }, [auth.profile, navigate]);

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
  
  // Show standardized loading state with the ConsultationsLoading component
  return (
    <div className="flex h-screen items-center justify-center">
      <RoleDebugger />
      <ConsultationsLoading />
    </div>
  );
};

export default PharmacyDashboard;
