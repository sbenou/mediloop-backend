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
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const initialRenderComplete = useRef(false);
  const stableAuthStateReceived = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    isPharmacist,
    visibleContent: visibleContent,
    firstContentShown: firstContentShown.current,
    initialRender: initialRenderComplete.current,
    stableAuthState: stableAuthStateReceived.current
  });

  // Mark initial render as complete after a brief delay
  useEffect(() => {
    if (!initialRenderComplete.current) {
      const timer = setTimeout(() => {
        initialRenderComplete.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Set content to be visible once authenticated
  useEffect(() => {
    // Once stable auth state is received, we can make decisions
    if (!isLoading) {
      stableAuthStateReceived.current = true;
    }
    
    // If we've shown content before, keep showing it regardless of auth state changes
    if (firstContentShown.current) {
      if (visibleContent !== 'content') {
        setVisibleContent('content');
      }
      return;
    }
    
    // Only change to content if authenticated and appropriate role
    if (stableAuthStateReceived.current && isAuthenticated && isPharmacist) {
      firstContentShown.current = true;
      setVisibleContent('content');
      console.log('Dashboard content shown - marking as visible permanently');
    } 
    // Only show loading if we're past initial render and have a stable auth state
    else if (stableAuthStateReceived.current && initialRenderComplete.current && visibleContent === 'initial') {
      setVisibleContent('loading');
    }
  }, [isLoading, isAuthenticated, isPharmacist, visibleContent, stableAuthStateReceived]);
  
  // Redirect to login if not authenticated - but only after initial loading and if we've never shown content
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !stableAuthStateReceived.current) {
      return;
    }
    
    // Only redirect if we're sure authentication has failed (not just loading)
    if (!isLoading && initialRenderComplete.current && !isAuthenticated) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate, initialRenderComplete, stableAuthStateReceived]);
  
  // Redirect to regular dashboard if not a pharmacist - but only after initial loading and if we've never shown content
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !stableAuthStateReceived.current) {
      return;
    }
    
    // Only redirect if we're sure user is not a pharmacist (not just loading)
    if (!isLoading && initialRenderComplete.current && isAuthenticated && !isPharmacist) {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, isPharmacist, initialRenderComplete, stableAuthStateReceived]);

  // If content is designated to be visible, always show the dashboard
  if (visibleContent === 'content') {
    return (
      <PharmacistLayout>
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={userRole} section={section} />
        </div>
      </PharmacistLayout>
    );
  }
  
  // Show loading state
  if (visibleContent === 'loading' || visibleContent === 'initial') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Fallback (should not reach here)
  return null;
};

export default PharmacyDashboard;
