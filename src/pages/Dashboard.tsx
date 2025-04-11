
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  const view = searchParams.get('view');
  const section = searchParams.get('section');
  
  // Handle unauthenticated users
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("[Dashboard][DEBUG] Not authenticated — redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Handle role-specific redirections
  useEffect(() => {
    // Only run if authenticated and not loading
    if (!isAuthenticated || isLoading) return;
    
    // Check if we should skip redirect
    const skipRedirect = sessionStorage.getItem('skip_dashboard_redirect') === 'true';
    if (skipRedirect) {
      console.log("[Dashboard][DEBUG] Skipping redirect due to flag");
      // Clear the skip flag after a delay
      setTimeout(() => sessionStorage.removeItem('skip_dashboard_redirect'), 2000);
      return;
    }
    
    // Get the user's role with failsafes
    const role = profile?.role || userRole || 'patient';
    console.log("[Dashboard][DEBUG] Role for redirect check:", role);
    
    // For pharmacists, if not on correct view, redirect
    if (role === 'pharmacist' && (view !== 'pharmacy' || section !== 'dashboard')) {
      console.log("[Dashboard][DEBUG] Pharmacist detected, redirecting to pharmacy dashboard");
      sessionStorage.setItem('skip_dashboard_redirect', 'true');
      
      // Show informational toast
      toast({
        title: "Redirecting",
        description: "Loading the pharmacist dashboard view"
      });
      
      setTimeout(() => {
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
      }, 300);
      
      return;
    }
    
    // For non-pharmacist roles, check against expected route
    const expectedRoute = getDashboardRouteByRole(role);
    const currentRoute = `/dashboard${location.search}`;
    
    // Only redirect if on wrong route and not too many attempts
    if (expectedRoute !== currentRoute && loadAttempts < 2) {
      console.log("[Dashboard][DEBUG] User on wrong route, redirecting");
      console.log(`Expected: ${expectedRoute}, Current: ${currentRoute}`);
      
      setLoadAttempts(prev => prev + 1);
      sessionStorage.setItem('skip_dashboard_redirect', 'true');
      
      // Navigate to correct route
      navigate(expectedRoute, { replace: true });
    }
  }, [isAuthenticated, isLoading, profile, userRole, view, section, navigate, loadAttempts]);

  // Enhanced loading state 
  if (isLoading || !isAuthenticated) {
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

  // Safety check - if still no role, show error
  if (!userRole && !profile?.role) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-6 w-full max-w-md p-8 rounded-lg border shadow-lg bg-red-50">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2 text-red-700">Role Detection Error</h2>
            <p className="text-red-600 mb-6">Unable to determine your user role. Please try logging out and in again.</p>
            <button 
              onClick={() => window.location.href = "/login"}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Return to Login
            </button>
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
