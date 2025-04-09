
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);
  const [redirectAttempts, setRedirectAttempts] = useState(0);

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if we're authenticated, have a profile, and haven't redirected yet
    if (isLoading || !isAuthenticated || !profile) return;
    
    // Maximum number of redirect attempts to prevent infinite loops
    if (redirectAttempts >= 3) {
      console.log("[LoginManager] Maximum redirect attempts reached");
      redirected.current = true;
      return;
    }
    
    // Don't redirect if we're already on a dashboard page
    if (location.pathname.includes('/dashboard') || location.pathname.includes('/superadmin')) {
      redirected.current = true;
      return;
    }

    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log("[LoginManager] Redirecting user to:", route);
    redirected.current = true;
    
    // Use a small timeout to ensure all state is updated before redirection
    setTimeout(() => {
      setRedirectAttempts(prev => prev + 1);
      navigate(route, { replace: true });
    }, 100);
  }, [isAuthenticated, profile, navigate, isLoading, location, redirectAttempts]);

  return {
    redirected: redirected.current,
  };
};
