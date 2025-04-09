
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if we're authenticated, have a profile, and haven't redirected yet
    if (isLoading || !isAuthenticated || !profile || redirected.current) return;
    
    // Don't redirect if we're already on a dashboard page
    if (location.pathname.includes('/dashboard') || location.pathname.includes('/superadmin')) {
      redirected.current = true;
      return;
    }

    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log("[LoginManager] Redirecting user to:", route);
    redirected.current = true;
    navigate(route, { replace: true });
  }, [isAuthenticated, profile, navigate, isLoading, location]);

  return {
    redirected: redirected.current,
  };
};
