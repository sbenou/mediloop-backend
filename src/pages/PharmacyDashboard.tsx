
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
  const [internalLoading, setInternalLoading] = useState(true);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Store whether we've ever displayed content
  const hasShownContentBefore = useRef(false);
  
  // Initial load state
  const initialLoadCompleted = useRef(false);
  
  // Mark initial render as completed after a short delay to ensure we don't flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      initialLoadCompleted.current = true;
      setInternalLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Console logging for debugging
  useEffect(() => {
    console.log("PharmacyDashboard render:", { 
      userRole, 
      isPharmacist,
      section,
      searchParams: Object.fromEntries(searchParams.entries()),
      profile,
      isLoading,
      internalLoading,
      isAuthenticated,
      hasShownContentBefore: hasShownContentBefore.current,
      initialLoadCompleted: initialLoadCompleted.current
    });
  }, [userRole, section, searchParams, isPharmacist, profile, isLoading, internalLoading, isAuthenticated]);
  
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
  
  // Once we've shown content, remember it
  useEffect(() => {
    if (!isLoading && isAuthenticated && isPharmacist) {
      // Mark that we've shown content at least once
      hasShownContentBefore.current = true;
    }
  }, [isLoading, isAuthenticated, isPharmacist]);
  
  // Return the main content if we've shown it before
  // This prevents the UI from going back to the loading state
  if (hasShownContentBefore.current) {
    return (
      <PharmacistLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={userRole} section={section} />
        </div>
      </PharmacistLayout>
    );
  }
  
  // Show loading state - but only if we've never shown content before
  // AND we're still in the initial loading phase
  if (!initialLoadCompleted.current || isLoading || isRedirecting || !isAuthenticated || (isAuthenticated && !isPharmacist)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Default render when we haven't shown content before but we're ready to show it
  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <PharmacyView userRole={userRole} section={section} />
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
