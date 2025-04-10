
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { toast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const section = searchParams.get('section');
  
  // Add debug logging to help identify issues
  useEffect(() => {
    console.log("Dashboard mounted", { 
      isAuthenticated, 
      isLoading,
      userRole, 
      view, 
      section,
      isPharmacist,
      profileData: profile ? {
        role: profile.role,
        fullName: profile.full_name,
        isPharmacist: profile.role === 'pharmacist'
      } : 'No profile'
    });
    
    // If loading takes too long, show a toast to inform the user
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        toast({
          title: "Still loading...",
          description: "Your dashboard is taking longer than expected to load. Please wait a moment.",
        });
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, userRole, profile, view, section, isPharmacist]);

  // Handle unauthenticated users with more detailed logging
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated — redirecting to login", {
        isLoading,
        isAuthenticated
      });
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Special handling for pharmacist users to ensure they have the correct view parameters
  // This now only runs once when the component mounts, not on every render
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile &&
       (userRole === 'pharmacist' || isPharmacist || profile.role === 'pharmacist') && 
       (!view || view !== 'pharmacy')) {
      console.log("Pharmacist detected without proper view parameters, updating URL");
      
      // Use window.location.href for a complete page refresh only if needed
      // But avoid doing it repeatedly (which would cause a loop)
      if (document.referrer !== window.location.href) {
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
      } else {
        console.log("Skipping redirect as we seem to be in a loop");
        toast({
          title: "Dashboard Loading",
          description: "Please wait while we prepare your pharmacy dashboard.",
        });
      }
    }
  }, []);  // Empty dependency array so it only runs once on mount

  // Enhanced loading state with better feedback
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
          <p className="text-xs text-muted-foreground">Please wait while we prepare your experience</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Only render dashboard content if we have authentication and role info
  if (isAuthenticated && userRole) {
    console.log("Access granted to role:", userRole);
    
    return (
      <RequireRoleGuard allowedRoles={["patient", "doctor", "pharmacist", "superadmin"]}>
        <UnifiedLayoutTemplate>
          <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
            <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
              <DashboardRouter userRole={userRole} />
            </ScrollArea>
          </div>
        </UnifiedLayoutTemplate>
      </RequireRoleGuard>
    );
  }

  // Fallback loading state (should rarely hit this)
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparing your dashboard...</p>
        <button 
          onClick={() => window.location.href = "/login"} 
          className="mt-4 text-sm text-primary underline"
        >
          Return to login
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
