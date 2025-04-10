
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardRouter from "@/components/dashboard/DashboardRouter";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { toast } from "@/components/ui/use-toast";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');
  const section = searchParams.get('section');
  
  // Add debug logging to help identify issues
  useEffect(() => {
    console.log("[Dashboard][DEBUG] Dashboard mounted", { 
      isAuthenticated, 
      isLoading,
      userRole, 
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
      navigationSource: sessionStorage.getItem('dashboard_navigation_source'),
      skipRedirect: sessionStorage.getItem('skip_dashboard_redirect'),
      loginSuccessful: sessionStorage.getItem('login_successful'),
      pathname: window.location.pathname,
      search: window.location.search,
      currentUrl: window.location.href
    });
    
    // Check if we should skip the dashboard redirect checks
    const skipRedirect = sessionStorage.getItem('skip_dashboard_redirect') === 'true';
    
    // If navigation came from menu, don't increment mount count
    const fromMenu = sessionStorage.getItem('dashboard_navigation_source') === 'menu';
    
    // Clear the flags after we've read them to avoid affecting future navigation
    if (fromMenu) {
      console.log("[Dashboard][DEBUG] Navigation came from menu, removing flag");
      sessionStorage.removeItem('dashboard_navigation_source');
    }
    
    if (skipRedirect) {
      // If we're skipping redirects, just clear the flag after a short delay
      // to allow router components to read it first
      console.log("[Dashboard][DEBUG] Skipping redirect check due to skip_dashboard_redirect flag");
      setTimeout(() => {
        sessionStorage.removeItem('skip_dashboard_redirect');
      }, 1000);
      return; // Exit early if skipping redirects
    } 
    
    // Only track mount count if not from menu and not skipping redirects
    if (!fromMenu && !skipRedirect) {
      const mountCount = parseInt(sessionStorage.getItem('dashboard_mount_count') || '0');
      sessionStorage.setItem('dashboard_mount_count', (mountCount + 1).toString());
      console.log("[Dashboard][DEBUG] Incrementing mount count", { mountCount: mountCount + 1 });
      
      // If we've mounted too many times in quick succession, show a warning
      if (mountCount > 3) {
        console.warn("[Dashboard][DEBUG] Possible redirect loop detected - dashboard mounted multiple times");
        
        // Reset the counter after warning and set skip flag to break the loop
        sessionStorage.setItem('skip_dashboard_redirect', 'true');
        setTimeout(() => {
          sessionStorage.removeItem('dashboard_mount_count');
        }, 2000);
        return;
      }
    }
    
    // Reset the counter after 5 seconds of stability
    const resetTimeout = setTimeout(() => {
      sessionStorage.removeItem('dashboard_mount_count');
    }, 5000);
    
    // Handle missing URL parameters for different roles when we have authentication data
    const handleRoleRedirection = () => {
      if (!skipRedirect && isAuthenticated && !isLoading && userRole) {
        // Check if the URL parameters match the expected ones for the current role
        const expectedRoute = getDashboardRouteByRole(userRole);
        console.log("[Dashboard][DEBUG] Expected route for", userRole, ":", expectedRoute);
        
        const expectedParams = new URLSearchParams(expectedRoute.split('?')[1] || '');
        const currentPath = window.location.pathname + window.location.search;
        
        console.log("[Dashboard][DEBUG] Checking if redirect is needed:", {
          userRole,
          expectedRoute,
          currentPath,
          matches: currentPath.includes(expectedRoute.split('?')[1] || '')
        });
        
        // If we're at /dashboard but missing expected parameters, redirect
        if (window.location.pathname === '/dashboard' && !currentPath.includes(expectedRoute.split('?')[1] || '')) {
          console.log(`[Dashboard][DEBUG] Detected missing parameters for ${userRole}. Expected: ${expectedRoute}, Current: ${currentPath}`);
          
          // Add a check for redirect attempt count to prevent loops
          const redirectCount = parseInt(sessionStorage.getItem('dashboard_redirect_count') || '0');
          console.log("[Dashboard][DEBUG] Redirect count:", redirectCount);
          
          if (redirectCount < 2) {
            sessionStorage.setItem('dashboard_redirect_count', (redirectCount + 1).toString());
            
            // For pharmacists, use direct navigation
            if (userRole === 'pharmacist' || isPharmacist || profile?.role === 'pharmacist') {
              console.log("[Dashboard][DEBUG] Using direct navigation for pharmacist");
              sessionStorage.setItem('skip_dashboard_redirect', 'true');
              console.log("[Dashboard][DEBUG] Navigating to:", expectedRoute);
              window.location.href = expectedRoute;
              return;
            }
            
            // For other roles, use React Router navigation
            console.log("[Dashboard][DEBUG] Using React Router navigation for role:", userRole);
            navigate(expectedRoute, { replace: true });
          } else {
            console.warn("[Dashboard][DEBUG] Maximum redirect attempts reached, continuing with current parameters");
            // Set the skip flag to break potential loops
            sessionStorage.setItem('skip_dashboard_redirect', 'true');
          }
        } else {
          // Reset the redirect counter if we're on the correct path
          sessionStorage.removeItem('dashboard_redirect_count');
        }
      }
    };
    
    // Only attempt role redirection if we have the necessary data
    if (!isLoading && isAuthenticated && userRole) {
      console.log("[Dashboard][DEBUG] Attempting role-based redirection");
      handleRoleRedirection();
    } else {
      console.log("[Dashboard][DEBUG] Skipping role redirection - missing required data", {
        isLoading, isAuthenticated, userRole
      });
    }
    
    // If loading takes too long, show a toast to inform the user
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        toast({
          title: "Still loading...",
          description: "Your dashboard is taking longer than expected to load. Please wait a moment.",
        });
      }
    }, 5000); // 5 second timeout
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resetTimeout);
    };
  }, [isAuthenticated, isLoading, userRole, profile, view, section, isPharmacist, navigate]);

  // Handle unauthenticated users with more detailed logging
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("[Dashboard][DEBUG] Not authenticated — redirecting to login", {
        isLoading,
        isAuthenticated,
        userRole
      });
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, userRole]);
  
  // Clear any pharmacy redirect flags on component unmount
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('pharmacy_redirect_attempt');
      sessionStorage.removeItem('pharmacy_redirect_count');
      // Don't clear skip_dashboard_redirect here as it might be needed by child components
    };
  }, []);

  // Add a function to force redirect if needed
  const forceRedirect = () => {
    console.log("[Dashboard][DEBUG] Manual redirect requested");
    
    if (!isAuthenticated || !userRole) {
      console.log("[Dashboard][DEBUG] Cannot redirect - not authenticated or no role");
      window.location.href = '/login';
      return;
    }
    
    // Set skip flag to prevent redirect loops
    sessionStorage.setItem('skip_dashboard_redirect', 'true');
    
    // Determine the correct route based on role
    const route = getDashboardRouteByRole(userRole);
    console.log(`[Dashboard][DEBUG] Forcing redirect to ${route}`);
    
    // Use direct navigation for more reliable redirect
    window.location.href = route;
  };

  // Log when rendering state changes
  console.log("[Dashboard][DEBUG] Rendering state:", {
    isLoading,
    isAuthenticated,
    userRole,
    view,
    section
  });

  // Enhanced loading state with better feedback
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
          <p className="text-xs text-muted-foreground">Please wait while we prepare your experience</p>
          <div className="flex flex-col items-center mt-4 space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs text-blue-500 hover:underline"
            >
              Click to reload if loading takes too long
            </button>
            <button 
              onClick={forceRedirect} 
              className="text-xs text-blue-500 hover:underline mt-2"
            >
              Force navigation to dashboard
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-4">
            Debug info: Role: {userRole || 'Unknown'} | Auth: {isAuthenticated ? 'Yes' : 'No'} 
          </div>
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
    console.log("[Dashboard][DEBUG] Access granted to role:", userRole);
    
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
        <div className="flex flex-col items-center mt-4">
          <button 
            onClick={() => window.location.href = "/login"} 
            className="mt-2 text-sm text-primary underline"
          >
            Return to login
          </button>
          <button 
            onClick={forceRedirect} 
            className="mt-2 text-sm text-primary underline"
          >
            Force dashboard navigation
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Role: {userRole || 'Unknown'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
