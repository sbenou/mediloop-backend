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
  const { isAuthenticated, isLoading } = useAuth();
  const auth = useRecoilValue(authState);
  const [visibleContent, setVisibleContent] = useState<'loading' | 'content' | 'initial'>('initial');
  
  // Tracking refs
  const redirectAttempted = useRef(false);
  const firstContentShown = useRef(false);
  const authReady = useRef(false);
  
  // Get the section parameter or default to dashboard
  const section = searchParams.get("section") || "dashboard";
  
  // Enhanced logging
  console.log('PharmacyDashboard render:', {
    isAuthenticated,
    isLoading,
    profileLoaded: !!auth.profile,
    profileRole: auth.profile?.role,
    isPharmacist: auth.profile?.role === 'pharmacist',
    authReady: authReady.current,
    redirectAttempted: redirectAttempted.current,
    contentShown: firstContentShown.current,
    visibleContent
  });
  
  // Mark authentication as ready when profile data is loaded or we have definitive auth state
  useEffect(() => {
    const profileExists = !!auth.profile;
    const definiteAuthState = !isLoading && (isAuthenticated || (!isAuthenticated && !auth.user));
    
    if (!authReady.current && definiteAuthState) {
      console.log("Auth state is ready:", { 
        isAuthenticated, 
        profileLoaded: profileExists,
        profileRole: auth.profile?.role
      });
      authReady.current = true;
    }
  }, [isLoading, isAuthenticated, auth.profile, auth.user]);
  
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
    if (!authReady.current) {
      if (visibleContent !== 'loading' && !isLoading) {
        setVisibleContent('loading');
      }
      return;
    }

    // Show content if authenticated as a pharmacist
    if (authReady.current && isAuthenticated && auth.profile &&
        auth.profile.role === 'pharmacist') {
      console.log('Showing pharmacy dashboard content - user is a pharmacist');
      firstContentShown.current = true;
      setVisibleContent('content');
    }
    // Show loading while waiting for auth state
    else if (visibleContent === 'initial' && !isLoading) {
      setVisibleContent('loading');
    }
  }, [
    isLoading, isAuthenticated, visibleContent, auth.profile
  ]);
  
  // Handle redirects when auth state is ready
  useEffect(() => {
    // Only process redirects if auth state is ready and we haven't shown content or attempted redirect
    if (!authReady.current || firstContentShown.current || redirectAttempted.current) {
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
    
    // Handle not a pharmacist case - this is critical
    if (isAuthenticated && auth.profile && auth.profile.role !== 'pharmacist') {
      console.log('Not a pharmacist, redirecting to dashboard');
      redirectAttempted.current = true;
      toast({
        title: "Access restricted",
        description: "Only pharmacists can access this dashboard.",
      });
      navigate("/dashboard");
      return;
    }
  }, [isAuthenticated, navigate, auth.profile, authReady.current]);

  // If content is designated to be visible, show the dashboard
  if (visibleContent === 'content') {
    return (
      <PharmacistLayout>
        <RoleDebugger />
        <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
          <PharmacyView userRole={auth.profile?.role || 'pharmacist'} section={section} />
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
