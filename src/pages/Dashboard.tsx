
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { toast } from "@/components/ui/use-toast";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile, isPharmacist, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);
  
  const view = searchParams.get('view');
  const section = searchParams.get('section');
  
  // Debug logging on component mount
  useEffect(() => {
    console.log("[Dashboard][DEBUG] Dashboard mounted", { 
      isAuthenticated, 
      isLoading,
      userRole, 
      user: user?.id,
      profileRole: profile?.role,
      view, 
      section,
      isPharmacist,
      profileData: profile ? {
        role: profile.role,
        fullName: profile.full_name,
        id: profile.id,
        isPharmacist: profile.role === 'pharmacist'
      } : 'No profile',
      skipRedirect: sessionStorage.getItem('skip_dashboard_redirect'),
      pathname: window.location.pathname,
      search: window.location.search,
      currentUrl: window.location.href
    });
    
    // Check if we should skip the dashboard redirect checks
    const skipRedirect = sessionStorage.getItem('skip_dashboard_redirect') === 'true';
    
    if (skipRedirect) {
      console.log("[Dashboard][DEBUG] Skipping redirect check due to skip_dashboard_redirect flag");
      setTimeout(() => {
        sessionStorage.removeItem('skip_dashboard_redirect');
      }, 1000);
      return;
    }
    
    // Reset the counter after 5 seconds of stability
    const resetTimeout = setTimeout(() => {
      sessionStorage.removeItem('dashboard_mount_count');
    }, 5000);
    
    return () => {
      clearTimeout(resetTimeout);
    };
  }, [isAuthenticated, isLoading, userRole, profile, view, section, isPharmacist, user, navigate]);

  // Handle unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("[Dashboard][DEBUG] Not authenticated — redirecting to login");
      navigate("/login", { replace: true });
    }
    
    // If we're a pharmacist, make sure we're on the correct view
    if (isAuthenticated && !isLoading && (profile?.role === 'pharmacist' || userRole === 'pharmacist' || isPharmacist)) {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const section = params.get('section');
      
      if (view !== 'pharmacy' || section !== 'dashboard') {
        console.log("[Dashboard][DEBUG] Pharmacist detected, forcing correct view parameters");
        // Set skip flag to prevent redirect loops
        sessionStorage.setItem('skip_dashboard_redirect', 'true');
        setRedirecting(true);
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
      }
    }
  }, [isAuthenticated, isLoading, navigate, userRole, profile, isPharmacist]);
  
  // Force redirect function with improved role detection
  const forceRedirect = () => {
    console.log("[Dashboard][DEBUG] Manual redirect requested");
    
    if (redirecting) {
      console.log("[Dashboard][DEBUG] Navigation already in progress, skipping");
      return;
    }
    
    setRedirecting(true);
    
    if (!isAuthenticated) {
      console.log("[Dashboard][DEBUG] Cannot redirect - not authenticated");
      window.location.href = '/login';
      return;
    }
    
    // Use multiple sources to determine role, with profile.role as highest priority
    const effectiveRole = profile?.role || userRole || (isPharmacist ? 'pharmacist' : 'patient');
    
    console.log(`[Dashboard][DEBUG] Force redirecting with detected role: ${effectiveRole}`);
    
    // Set skip flag to prevent redirect loops
    sessionStorage.setItem('skip_dashboard_redirect', 'true');
    
    toast({
      title: "Redirecting to dashboard",
      description: `Navigating to your ${effectiveRole} dashboard`,
    });
    
    // Short delay to allow the toast to display
    setTimeout(() => {
      // Determine the correct route based on role
      const route = effectiveRole === 'pharmacist' 
        ? '/dashboard?view=pharmacy&section=dashboard'
        : getDashboardRouteByRole(effectiveRole);
      
      console.log(`[Dashboard][DEBUG] Forcing redirect to ${route}`);
      window.location.href = route;
    }, 300);
  };

  // Enhanced loading state 
  if (isLoading || !userRole || redirecting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-6 w-full max-w-md p-8 rounded-lg border shadow-lg">
          <Loader className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
            <p className="text-muted-foreground mb-6">Please wait while we redirect you to the appropriate dashboard</p>
          </div>
          
          <Button 
            onClick={forceRedirect} 
            className="w-full"
            size="lg"
            variant="default"
            disabled={redirecting}
          >
            {redirecting ? (
              <div className="flex items-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Redirecting...
              </div>
            ) : (
              "Go to dashboard"
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayoutTemplate>
      <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
        <DashboardRouter userRole={userRole} />
      </ScrollArea>
    </UnifiedLayoutTemplate>
  );
};

export default Dashboard;
