
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
  const initialRenderComplete = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Record when we first show the dashboard content
  const hasShownContentBefore = useRef(false);
  
  // Ensure we don't go back to loading state after showing content
  useEffect(() => {
    // Only set this once - on first successful auth
    if (!hasShownContentBefore.current && !isLoading && isAuthenticated && isPharmacist) {
      console.log("Dashboard content shown - locking UI state");
      hasShownContentBefore.current = true;
    }
    
    // Mark initial render as complete after a brief delay
    if (!initialRenderComplete.current) {
      const timer = setTimeout(() => {
        initialRenderComplete.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, isPharmacist]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    // Skip during initial loading or if we've already shown content
    if (hasShownContentBefore.current || redirectAttempted.current) {
      return;
    }
    
    // Only redirect if we're sure authentication has failed (not just loading)
    if (!isLoading && !isAuthenticated) {
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
    // Skip during initial loading or if we've already shown content
    if (hasShownContentBefore.current || redirectAttempted.current) {
      return;
    }
    
    // Only redirect if we're sure user is not a pharmacist (not just loading)
    if (!isLoading && isAuthenticated && !isPharmacist) {
      redirectAttempted.current = true;
      setIsRedirecting(true);
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, isPharmacist]);

  // If we've shown content before or completed initial render, always show the dashboard
  if (hasShownContentBefore.current || (initialRenderComplete.current && isAuthenticated && isPharmacist)) {
    return (
      <PharmacistLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={userRole} section={section} />
        </div>
      </PharmacistLayout>
    );
  }
  
  // Show loading state but not if we've previously shown content
  if (!hasShownContentBefore.current && (isLoading || isRedirecting)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Default loading state for very first render
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
