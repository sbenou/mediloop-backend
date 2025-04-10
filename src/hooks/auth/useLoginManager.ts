
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { toast } from "@/components/ui/use-toast";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading, isPharmacist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);

  // Add a dedicated function for profile-based redirection
  const performRoleBasedRedirection = (role: string) => {
    // Get the dashboard route for this role
    const route = getDashboardRouteByRole(role);
    
    console.log(`[LoginManager][DEBUG] Redirecting user with role ${role} to ${route}`, {
      redirectAttempts,
      currentPath: location.pathname,
      isPharmacist,
      skipDashboardRedirect: sessionStorage.getItem('skip_dashboard_redirect')
    });
    
    // Always set skip_dashboard_redirect to prevent redirect loops
    sessionStorage.setItem('skip_dashboard_redirect', 'true');
    
    try {
      // Use window.location.href for all roles to ensure a complete page refresh
      console.log("[LoginManager][DEBUG] Using direct navigation to:", route);
      
      // For pharmacists, use a very direct approach to avoid navigation issues
      if (role === 'pharmacist' || isPharmacist) {
        console.log("[LoginManager][DEBUG] Using special pharmacist redirection path");
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
      } else {
        window.location.href = route;
      }
      
      redirected.current = true;
      
      // Show a toast to indicate successful login
      toast({
        title: "Login successful",
        description: `Welcome, ${profile.full_name || 'User'}!`,
      });
      
      return true;
    } catch (error) {
      console.error("[LoginManager][DEBUG] Navigation error:", error);
      return false;
    }
  };

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if authentication has been checked and we're not currently loading
    if (isLoading) {
      console.log("[LoginManager][DEBUG] Still loading auth state, waiting...", { 
        isAuthenticated, 
        role: profile?.role,
        isPharmacist
      });
      return;
    }
    
    // If we've already redirected or aren't authenticated, don't do anything
    if (!isAuthenticated) {
      console.log("[LoginManager][DEBUG] User not authenticated, no redirect needed");
      return;
    }
    
    if (redirected.current) {
      console.log("[LoginManager][DEBUG] Already redirected, skip");
      return;
    }
    
    // Make sure we have a valid profile before redirecting
    if (!profile) {
      console.log("[LoginManager][DEBUG] No profile available, waiting for profile data");
      return;
    }
    
    // Maximum number of redirect attempts to prevent infinite loops
    if (redirectAttempts >= 3) {
      console.log("[LoginManager][DEBUG] Maximum redirect attempts reached", { redirectAttempts });
      redirected.current = true;
      return;
    }
    
    // Add a time-based throttle to prevent rapid redirect attempts
    const now = Date.now();
    if (now - lastAttemptTime < 2000) { // 2 second cooldown
      console.log("[LoginManager][DEBUG] Throttling redirect attempts", { 
        timeSinceLastAttempt: now - lastAttemptTime,
        redirectAttempts
      });
      return;
    }
    setLastAttemptTime(now);
    
    // Don't redirect if we're already on a dashboard page
    if (location.pathname.includes('/dashboard') || location.pathname.includes('/superadmin')) {
      console.log("[LoginManager][DEBUG] Already on dashboard page, marking as redirected", { 
        path: location.pathname,
        query: location.search 
      });
      redirected.current = true;
      return;
    }

    console.log("[LoginManager][DEBUG] Profile available:", profile);
    const role = profile.role;

    // Increment the redirect attempts
    setRedirectAttempts(prevAttempts => prevAttempts + 1);
    
    // Perform the actual redirection based on role
    if (role) {
      performRoleBasedRedirection(role);
    } else {
      console.error("[LoginManager][DEBUG] No role defined in profile, cannot redirect");
    }
  }, [isAuthenticated, profile, navigate, isLoading, location, redirectAttempts, lastAttemptTime, isPharmacist]);

  return {
    redirected: redirected.current,
  };
};
