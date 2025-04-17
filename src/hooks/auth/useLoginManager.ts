
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if we're authenticated, have a profile, and haven't redirected yet
    if (isLoading || !isAuthenticated || !profile || redirected.current) {
      console.log("[LoginManager] Not ready for redirect yet:", { 
        isLoading, 
        isAuthenticated, 
        hasProfile: !!profile, 
        alreadyRedirected: redirected.current 
      });
      return;
    }
    
    // If we're already on the dashboard page, don't redirect again
    if (window.location.pathname === '/dashboard') {
      console.log("[LoginManager] Already on dashboard, skipping redirect");
      redirected.current = true;
      return;
    }

    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log("[LoginManager] Redirecting user to:", route, "with role:", role);
    console.log("[LoginManager] Full profile data:", profile);
    
    redirected.current = true;
    navigate(route, { replace: true });
    
    // Log after navigation attempt
    console.log("[LoginManager] Navigation triggered, redirected state:", redirected.current);
    
    // Add a timer to detect if we're still on the page after redirect attempt
    setTimeout(() => {
      console.log("[LoginManager] Post-redirect check - Current URL:", window.location.href);
    }, 500);
  }, [isAuthenticated, profile, navigate, isLoading]);

  return {
    redirected: redirected.current,
  };
};
