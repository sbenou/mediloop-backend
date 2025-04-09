
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view');
  const section = searchParams.get('section');

  // Add more detailed logging to help debug
  useEffect(() => {
    console.log("✅ Dashboard mounted", { 
      isAuthenticated, 
      userRole, 
      view, 
      section,
      isPharmacist,
      profileData: profile ? {
        role: profile.role,
        isPharmacist: profile.role === 'pharmacist'
      } : 'No profile'
    });
    
    if (!isLoading && !isAuthenticated) {
      console.warn("🔒 Not authenticated — redirecting to login");
      navigate("/login", { replace: true });
    }
    
    // Special handling for pharmacist users to ensure they have the correct view parameters
    if (!isLoading && isAuthenticated && 
       (userRole === 'pharmacist' || isPharmacist || profile?.role === 'pharmacist') && 
       (!view || view !== 'pharmacy')) {
      console.log("🔄 Pharmacist detected without proper view parameters, updating URL and doing hard redirect");
      
      // Using window.location for a more reliable redirect
      window.location.href = '/dashboard?view=pharmacy&section=' + (section || 'dashboard');
      return;
    }
  }, [isAuthenticated, navigate, isLoading, userRole, profile, view, section, isPharmacist, setSearchParams]);

  console.log("Dashboard rendering with params:", Object.fromEntries(searchParams.entries()));
  
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.warn("🔒 Not authenticated — rendering login redirect");
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && userRole) {
    console.log("🔓 Access granted to role:", userRole);
    
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
      </div>
    </div>
  );
};

export default Dashboard;
