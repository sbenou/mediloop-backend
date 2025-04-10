
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

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if authentication has been checked and we're not currently loading
    if (isLoading) {
      console.log("[LoginManager] Still loading auth state, waiting...");
      return;
    }
    
    // If we've already redirected or aren't authenticated, don't do anything
    if (!isAuthenticated) {
      console.log("[LoginManager] User not authenticated, no redirect needed");
      return;
    }
    
    if (redirected.current) {
      console.log("[LoginManager] Already redirected, skip");
      return;
    }
    
    // Make sure we have a valid profile before redirecting
    if (!profile) {
      console.log("[LoginManager] No profile available, waiting for profile data");
      return;
    }
    
    // Maximum number of redirect attempts to prevent infinite loops
    if (redirectAttempts >= 3) {
      console.log("[LoginManager] Maximum redirect attempts reached");
      redirected.current = true;
      return;
    }
    
    // Add a time-based throttle to prevent rapid redirect attempts
    const now = Date.now();
    if (now - lastAttemptTime < 2000) { // 2 second cooldown
      console.log("[LoginManager] Throttling redirect attempts");
      return;
    }
    setLastAttemptTime(now);
    
    // Don't redirect if we're already on a dashboard page
    if (location.pathname.includes('/dashboard') || location.pathname.includes('/superadmin')) {
      console.log("[LoginManager] Already on dashboard page, marking as redirected");
      redirected.current = true;
      return;
    }

    console.log("[LoginManager] Profile available:", profile);
    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log(`[LoginManager] Redirecting user with role ${role} to ${route}`);
    setRedirectAttempts(prevAttempts => prevAttempts + 1);
    
    // Set skip redirect flag to prevent redirect loops
    sessionStorage.setItem('skip_dashboard_redirect', 'true');
    
    // Handle the navigation differently based on role to ensure correct parameters
    try {
      // For pharmacists, use window.location.href for a complete page refresh to ensure proper loading
      if (role === 'pharmacist' || isPharmacist) {
        console.log("[LoginManager] Using direct navigation for pharmacist");
        
        // Use window.location.href instead of navigate for a complete page refresh
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
        
        // We still mark as redirected even though we're doing a hard redirect
        redirected.current = true;
      } else {
        // For other roles, use the direct URL navigation to ensure consistent behavior
        window.location.href = route;
        redirected.current = true;
      }
      
      // Show a toast to indicate successful login
      toast({
        title: "Login successful",
        description: `Welcome, ${profile.full_name || 'User'}!`,
      });
    } catch (error) {
      console.error("[LoginManager] Navigation error:", error);
    }
  }, [isAuthenticated, profile, navigate, isLoading, location, redirectAttempts, lastAttemptTime, isPharmacist]);

  return {
    redirected: redirected.current,
  };
};
