
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { toast } from "@/components/ui/use-toast";
import { authState } from "@/store/auth/atoms";
import { useRecoilValue } from "recoil";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";

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
    redirectRef: redirectAttempted.current
  });
  
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
          description: "Please login to access the pharmacy dashboard.",
        });
        navigate("/login");
        return;
      }
      
      // Handle wrong role case
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
      
      // Show content if authenticated with pharmacist role
      if (isAuthenticated && auth.profile?.role === 'pharmacist' && !contentShown.current) {
        console.log('Showing pharmacy content - user is a pharmacist');
        contentShown.current = true;
        setShowContent(true);
      }
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

export default PharmacyDashboard;
