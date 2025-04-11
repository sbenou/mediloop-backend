
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const view = searchParams.get('view');
  const section = searchParams.get('section');
  
  // Debug logging on component mount
  useEffect(() => {
    console.log("[Dashboard][DEBUG] Dashboard mounted", { 
      isAuthenticated, 
      isLoading,
      userRole, 
      profileRole: profile?.role,
      view, 
      section,
      isPharmacist: profile?.role === 'pharmacist',
      skipRedirect: sessionStorage.getItem('skip_dashboard_redirect')
    });
    
    // Clean up any navigation flags after dashboard is loaded
    const resetTimeout = setTimeout(() => {
      sessionStorage.removeItem('dashboard_mount_count');
      sessionStorage.removeItem('dashboard_redirect_count');
      sessionStorage.removeItem('pharmacy_redirect_count');
    }, 5000);
    
    return () => {
      clearTimeout(resetTimeout);
    };
  }, [isAuthenticated, isLoading, userRole, profile, view, section]);

  // Handle unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("[Dashboard][DEBUG] Not authenticated — redirecting to login");
      navigate("/login", { replace: true });
    }
    
    // If we're a pharmacist, make sure we're on the correct view
    if (isAuthenticated && !isLoading && profile?.role === 'pharmacist') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const section = params.get('section');
      
      if (view !== 'pharmacy' || section !== 'dashboard') {
        console.log("[Dashboard][DEBUG] Pharmacist detected, forcing correct view parameters");
        // Set skip flag to prevent redirect loops
        sessionStorage.setItem('skip_dashboard_redirect', 'true');
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
      }
    }
  }, [isAuthenticated, isLoading, navigate, userRole, profile]);

  // Enhanced loading state 
  if (isLoading || !userRole) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-6 w-full max-w-md p-8 rounded-lg border shadow-lg">
          <Loader className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground mb-6">Please wait while we load your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayoutTemplate>
      <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
        <DashboardRouter userRole={profile?.role || userRole} />
      </ScrollArea>
    </UnifiedLayoutTemplate>
  );
};

export default Dashboard;
