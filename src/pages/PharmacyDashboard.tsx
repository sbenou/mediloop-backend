
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { toast } from "@/components/ui/use-toast";

const PharmacyDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile, isPharmacist } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectAttempted = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Never revert to loading state once content is shown
  const hasShownContentBefore = useRef(false);
  
  // Ensure we don't go back to loading state
  useEffect(() => {
    if (!isLoading && isAuthenticated && isPharmacist) {
      hasShownContentBefore.current = true;
    }
  }, [isLoading, isAuthenticated, isPharmacist]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirectAttempted.current) {
      redirectAttempted.current = true;
      setIsRedirecting(true);
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Redirect to regular dashboard if not a pharmacist
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPharmacist && !redirectAttempted.current) {
      redirectAttempted.current = true;
      setIsRedirecting(true);
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, isPharmacist]);
  
  // Return the main content if we've shown it before
  if (hasShownContentBefore.current) {
    return (
      <PharmacistLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={userRole} section={section} />
        </div>
      </PharmacistLayout>
    );
  }
  
  // Show loading state only if we're still in initial loading
  if (isLoading || isRedirecting || !isAuthenticated || (isAuthenticated && !isPharmacist)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Default render when authenticated and is pharmacist
  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <PharmacyView userRole={userRole} section={section} />
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
