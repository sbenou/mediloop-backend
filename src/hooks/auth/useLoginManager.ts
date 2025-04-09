
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
    if (isLoading || !isAuthenticated || !profile || redirected.current) return;
    
    // If we're already on the dashboard page for non-pharmacist users, don't redirect again
    if (profile.role !== 'pharmacist' && window.location.pathname === '/dashboard') {
      redirected.current = true;
      return;
    }

    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log("[LoginManager] Redirecting user with role", role, "to:", route);
    redirected.current = true;
    navigate(route, { replace: true });
  }, [isAuthenticated, profile, navigate, isLoading]);

  return {
    redirected: redirected.current,
  };
};
