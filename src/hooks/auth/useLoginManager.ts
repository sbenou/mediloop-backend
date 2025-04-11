
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirected, setRedirected] = useState(false);
  const redirectAttempts = useRef(0);

  // Handle role-based redirects
  useEffect(() => {
    // Only proceed if authentication has been checked and we're not currently loading
    if (isLoading || !isAuthenticated || redirected) {
      return;
    }
    
    // If we're already on the dashboard page, don't redirect again
    if (window.location.pathname.includes('/dashboard')) {
      setRedirected(true);
      return;
    }

    // Get the role from the profile if available, otherwise use the userRole
    const role = profile?.role || userRole || 'user';
    
    // Check if we've already tried too many redirects
    if (redirectAttempts.current >= 3) {
      console.log(`[LoginManager] Max redirect attempts reached for role ${role}, using direct location change`);
      
      // For pharmacists, use a direct URL change to ensure the correct parameters
      if (role === 'pharmacist') {
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
      } else {
        window.location.href = getDashboardRouteByRole(role);
      }
      setRedirected(true);
      return;
    }
    
    redirectAttempts.current++;
    const route = getDashboardRouteByRole(role);

    console.log(`[LoginManager] Redirecting user with role ${role} to:`, route);
    setRedirected(true);
    
    // Use navigate for a smoother transition
    navigate(route, { replace: true });
    
  }, [isAuthenticated, profile, navigate, isLoading, userRole, redirected]);

  return {
    redirected,
  };
};
