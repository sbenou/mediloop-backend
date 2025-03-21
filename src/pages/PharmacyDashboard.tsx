import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { PharmacyView } from "@/components/dashboard/views";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { toast } from "@/components/ui/use-toast";
import { authState } from "@/store/auth/atoms";
import { useRecoilValue } from "recoil";
import { RoleDebugger } from "@/components/user-menu/RoleDebugger";

const PharmacyDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, userRole, isLoading, profile, isPharmacist } = useAuth();
  const auth = useRecoilValue(authState);
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  
  // Tracking refs
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const authStateReady = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    isPharmacist,
    isPharmacistDirect: auth.profile?.role === 'pharmacist',
    visibleContent,
    firstContentShown: firstContentShown.current,
    authStateReady: authStateReady.current,
    profileLoaded: !!auth.profile
  });

  // CRITICAL: Wait for profile data to be loaded before making decisions
  useEffect(() => {
    // We consider the auth state ready when loading is complete AND
    // either we have a profile (authenticated) or we're definitely not authenticated
    if (!authStateReady.current && !isLoading && (auth.profile || !isAuthenticated)) {
      authStateReady.current = true;
      console.log("Auth state is ready, profile loaded:", !!auth.profile);
    }
  }, [isLoading, isAuthenticated, auth.profile]);

  // Set content visibility once auth state is ready
  useEffect(() => {
    // If content is already shown, keep showing it
    if (firstContentShown.current) {
      if (visibleContent !== 'content') {
        setVisibleContent('content');
      }
      return;
    }
    
    // Only proceed if auth state is ready
    if (!authStateReady.current) {
      if (visibleContent !== 'loading' && !isLoading) {
        setVisibleContent('loading');
      }
      return;
    }

    // Show content if authenticated as a pharmacist
    if (authStateReady.current && isAuthenticated && auth.profile &&
        (auth.profile.role === 'pharmacist' || isPharmacist)) {
      console.log('Showing pharmacy dashboard content - user is a pharmacist');
      firstContentShown.current = true;
      setVisibleContent('content');
    }
    // Show loading while waiting for auth state
    else if (visibleContent === 'initial' && !isLoading) {
      setVisibleContent('loading');
    }
  }, [
    isLoading, isAuthenticated, isPharmacist,
    visibleContent, auth.profile
  ]);
  
  // Handle redirects when auth state is ready
  useEffect(() => {
    // Only process redirects if auth state is ready and we haven't shown content or attempted redirect
    if (!authStateReady.current || firstContentShown.current || redirectAttempted.current) {
      return;
    }

    // Handle not authenticated case
    if (!isAuthenticated) {
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
    
    // Handle not a pharmacist case
    if (isAuthenticated && auth.profile && 
        auth.profile.role !== 'pharmacist' && !isPharmacist) {
      console.log('Not a pharmacist, redirecting to dashboard');
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, navigate, isPharmacist, auth.profile, authStateReady]);

  // If content is designated to be visible, show the dashboard
  if (visibleContent === 'content') {
    return (
      <PharmacistLayout>
        <RoleDebugger />
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={userRole} section={section} />
        </div>
      </PharmacistLayout>
    );
  }
  
  // Show loading state
  return (
    <div className="flex h-screen items-center justify-center">
      <RoleDebugger />
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-primary border-b-2"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
