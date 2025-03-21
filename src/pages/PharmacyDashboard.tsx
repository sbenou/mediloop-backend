import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { toast } from "@/components/ui/use-toast";
import { authState } from "@/store/auth/atoms";
import { useRecoilValue } from "recoil";

const PharmacyDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile, isPharmacist } = useAuth();
  const auth = useRecoilValue(authState);
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const initialRenderComplete = useRef(false);
  const sessionCheckComplete = useRef(false);
  const authStateStable = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    isPharmacist,
    isPharmacistDirect: auth.profile?.role === 'pharmacist',
    visibleContent: visibleContent,
    firstContentShown: firstContentShown.current,
    initialRender: initialRenderComplete.current,
    stableAuthState: authStateStable.current,
    sessionCheckComplete: sessionCheckComplete.current
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
  
  // Detect a stable auth state - this needs to happen BEFORE any redirect logic
  useEffect(() => {
    // We have a stable auth state when:
    // 1. isLoading has completed (is false)
    // 2. We have either successfully authenticated or definitely failed
    // 3. If authenticated, we have loaded the profile data
    if (!authStateStable.current && !isLoading) {
      if (!isAuthenticated) {
        // Definitely not authenticated - stable state
        authStateStable.current = true;
        console.log("Auth state stable: Not authenticated");
      } else if (auth.profile) {
        // Authenticated with profile - stable state
        authStateStable.current = true;
        console.log("Auth state stable: Authenticated with profile", auth.profile);
      }
    }
  }, [isLoading, isAuthenticated, auth.profile]);
  
  // After a brief delay, check if the session is complete
  useEffect(() => {
    if (!sessionCheckComplete.current && initialRenderComplete.current) {
      const timer = setTimeout(() => {
        sessionCheckComplete.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialRenderComplete]);
  
  // Set content to be visible once authenticated
  useEffect(() => {
    // If we've shown content before, always keep showing it
    if (firstContentShown.current) {
      if (visibleContent !== 'content') {
        setVisibleContent('content');
      }
      return;
    }
    
    // Show content if authenticated as a pharmacist
    if (authStateStable.current && isAuthenticated && 
        (isPharmacist || auth.profile?.role === 'pharmacist')) {
      firstContentShown.current = true;
      setVisibleContent('content');
      console.log('Dashboard content shown - marking as visible permanently');
    } 
    // Show loading if we're past initial render but don't have stable auth yet
    else if (sessionCheckComplete.current && visibleContent === 'initial') {
      setVisibleContent('loading');
    }
  }, [
    isLoading, isAuthenticated, isPharmacist, 
    visibleContent, auth.profile, 
    authStateStable, sessionCheckComplete
  ]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !authStateStable.current) {
      return;
    }
    
    // Only redirect if we're sure authentication has failed
    if (authStateStable.current && !isAuthenticated) {
      redirectAttempted.current = true;
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access the pharmacy dashboard.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, navigate, authStateStable]);
  
  // Redirect to regular dashboard if not a pharmacist
  useEffect(() => {
    if (firstContentShown.current || redirectAttempted.current || !authStateStable.current) {
      return;
    }
    
    // Only redirect if we're sure user is not a pharmacist
    if (authStateStable.current && isAuthenticated && 
        !isPharmacist && auth.profile?.role !== 'pharmacist') {
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, isPharmacist, authStateStable, auth.profile]);

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
