
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasInitializedRef = useRef(false);
  const redirectedRef = useRef(false);
  const renderCountRef = useRef(0);

  // Add more detailed logging to help debug
  useEffect(() => {
    renderCountRef.current += 1;
    
    console.log("✅ Dashboard mounted", { 
      isAuthenticated, 
      userRole, 
      profileRole: profile?.role,
      isPharmacist: profile?.role === 'pharmacist',
      pathname: window.location.pathname,
      search: window.location.search,
      renderCount: renderCountRef.current
    });
    
    // Only perform redirect once and only if needed
    if (!isLoading && !isAuthenticated && !redirectedRef.current) {
      console.warn("🔒 Not authenticated — redirecting to login");
      redirectedRef.current = true;
      navigate("/login", { replace: true });
    }
    
    // Track mount count to detect repeated mounts
    const mountCount = parseInt(sessionStorage.getItem('dashboard_mount_count') || '0') + 1;
    sessionStorage.setItem('dashboard_mount_count', mountCount.toString());
    console.log("✅ Dashboard mount count:", mountCount);
    
    // Log the navigator.userAgent to detect browser/environment
    console.log("✅ User agent:", navigator.userAgent);
    
    // Capture full search params for debugging
    console.log("✅ Dashboard search parameters:", Object.fromEntries(searchParams.entries()));
    
    // Mark as initialized to prevent multiple redirects
    hasInitializedRef.current = true;
    
    return () => {
      console.log("❌ Dashboard unmounted");
    };
  }, [isAuthenticated, navigate, isLoading, userRole, profile, searchParams]);

  // Prevent unnecessary re-renderings by memoizing the search params
  const paramsObj = Object.fromEntries(searchParams.entries());
  console.log("Dashboard rendering with params:", paramsObj);
  
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
