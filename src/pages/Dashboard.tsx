
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
import { supabase } from "@/lib/supabase";

const Dashboard = () => {
  const { isAuthenticated, isLoading, userRole, profile, isPharmacist, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [forceNavAttempted, setForceNavAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [manualProfileFetchInProgress, setManualProfileFetchInProgress] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
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
    
    return () => {
      clearTimeout(resetTimeout);
    };
  }, [isAuthenticated, isLoading, userRole, profile, view, section, isPharmacist, user, navigate]);

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
  
  // Add automatic retry mechanism for profile detection
  useEffect(() => {
    // If we're authenticated but don't have a role yet, try to fetch it again
    if (isAuthenticated && user && !userRole && !forceNavAttempted && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log("[Dashboard][DEBUG] Detected authenticated user without role, retrying profile fetch");
        // Increment retry counter
        setRetryCount(prev => prev + 1);
        
        // Directly trigger a force navigation after a few retries
        if (retryCount >= 2) {
          forceRedirect();
          setForceNavAttempted(true);
        }
      }, 1500); // Increased delay between retries
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isAuthenticated, user, userRole, forceNavAttempted, retryCount]);

  // Manual profile fetch function
  const manualProfileFetch = async () => {
    if (!user?.id) {
      console.error("[Dashboard][DEBUG] Cannot fetch profile - no user ID");
      return null;
    }
    
    setManualProfileFetchInProgress(true);
    
    try {
      console.log("[Dashboard][DEBUG] Performing manual profile fetch for user:", user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error("[Dashboard][DEBUG] Manual profile fetch error:", error);
        return null;
      }
      
      if (profile) {
        console.log("[Dashboard][DEBUG] Manual profile fetch successful:", profile);
        return profile;
      } else {
        console.log("[Dashboard][DEBUG] Manual profile fetch: No profile found");
        return null;
      }
    } catch (err) {
      console.error("[Dashboard][DEBUG] Error in manual profile fetch:", err);
      return null;
    } finally {
      setManualProfileFetchInProgress(false);
    }
  };

  // Force redirect function with improved role detection
  const forceRedirect = async () => {
    console.log("[Dashboard][DEBUG] Manual redirect requested");
    
    if (isNavigating) {
      console.log("[Dashboard][DEBUG] Navigation already in progress, skipping");
      return;
    }
    
    setIsNavigating(true);
    
    if (!isAuthenticated) {
      console.log("[Dashboard][DEBUG] Cannot redirect - not authenticated");
      window.location.href = '/login';
      return;
    }
    
    // Try to fetch the profile directly to ensure we have the most accurate role
    const manuallyFetchedProfile = await manualProfileFetch();
    
    // Use multiple sources to determine role, with manually fetched profile as highest priority
    const effectiveRole = 
      manuallyFetchedProfile?.role || 
      profile?.role || 
      userRole || 
      (isPharmacist ? 'pharmacist' : 'user');
    
    console.log(`[Dashboard][DEBUG] Force redirecting with detected role: ${effectiveRole}`, {
      userRole,
      profileRole: profile?.role,
      manuallyFetchedRole: manuallyFetchedProfile?.role,
      isPharmacist
    });
    
    // Set skip flag to prevent redirect loops
    sessionStorage.setItem('skip_dashboard_redirect', 'true');
    
    try {
      // Show toast before navigation
      toast({
        title: "Redirecting to dashboard",
        description: `Navigating to your ${effectiveRole || 'user'} dashboard`,
      });
      
      // Short delay to allow the toast to display
      setTimeout(() => {
        // Determine the correct route based on role
        const route = effectiveRole === 'pharmacist' 
          ? '/dashboard?view=pharmacy&section=dashboard'
          : getDashboardRouteByRole(effectiveRole);
          
        console.log(`[Dashboard][DEBUG] Forcing redirect to ${route}`);
        
        // Use window.location.replace for more reliable navigation
        window.location.replace(route);
      }, 300);
    } catch (error) {
      console.error("[Dashboard][DEBUG] Navigation error:", error);
      setIsNavigating(false);
      
      // Fallback navigation as last resort
      setTimeout(() => {
        const fallbackRoute = '/dashboard?view=pharmacy&section=dashboard';
        console.log(`[Dashboard][DEBUG] Using fallback navigation to: ${fallbackRoute}`);
        window.location.href = fallbackRoute;
      }, 500);
    }
  };

  // Enhanced loading state with better feedback and more prominent force navigation button
  if (isLoading || !userRole || manualProfileFetchInProgress) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-6 w-full max-w-md p-8 rounded-lg border shadow-lg">
          <Loader className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Loading your dashboard...</h2>
            <p className="text-muted-foreground mb-6">Please wait while we prepare your experience</p>
          </div>
          
          <div className="flex flex-col items-center w-full space-y-4">
            <Button 
              onClick={forceRedirect} 
              className="w-full"
              size="lg"
              variant="default"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <div className="flex items-center">
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Navigating...
                </div>
              ) : (
                "Force navigation to dashboard"
              )}
            </Button>
            
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isNavigating}
            >
              Reload page
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 mt-4 text-center">
            Debug info: Role: {profile?.role || userRole || 'Unknown'} | Auth: {isAuthenticated ? 'Yes' : 'No'} | User ID: {user?.id || 'None'}
          </div>
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

  // Fallback if we have authentication but no role yet
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparing your dashboard...</p>
        <div className="flex flex-col items-center mt-4">
          <Button 
            onClick={() => forceRedirect()} 
            className="mt-2"
            variant="default"
            disabled={isNavigating}
          >
            {isNavigating ? (
              <div className="flex items-center">
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Navigating...
              </div>
            ) : (
              "Force dashboard navigation"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Role: {profile?.role || userRole || 'Unknown'}</p>
      </div>
    </div>
  );
};

export default Dashboard;
