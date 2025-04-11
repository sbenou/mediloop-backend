
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if authentication has been checked and we're not currently loading
    if (isLoading || !isAuthenticated || redirected.current) {
      return;
    }
    
    // If we're already on the dashboard page, don't redirect again
    if (window.location.pathname.includes('/dashboard')) {
      redirected.current = true;
      return;
    }

    // Get the role from the profile if available, otherwise use a default
    const role = profile?.role || 'user';
    const route = getDashboardRouteByRole(role);

    console.log(`[LoginManager] Redirecting user with role ${role} to:`, route);
    redirected.current = true;
    
    // Use navigate for a smoother transition
    navigate(route, { replace: true });
    
  }, [isAuthenticated, profile, navigate, isLoading]);

  return {
    redirected: redirected.current,
  };
};
