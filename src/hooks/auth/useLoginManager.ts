
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

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
    if (isLoading) return;
    
    // If we've already redirected or aren't authenticated, don't do anything
    if (!isAuthenticated || redirected.current) return;
    
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
      redirected.current = true;
      return;
    }

    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log("[LoginManager] Redirecting user to:", route);
    setRedirectAttempts(prevAttempts => prevAttempts + 1);
    
    // Handle the pharmacist route specially to ensure correct parameters
    if (role === 'pharmacist' || isPharmacist) {
      window.location.href = '/dashboard?view=pharmacy&section=dashboard';
    } else {
      window.location.href = route;
    }
    
    redirected.current = true;
  }, [isAuthenticated, profile, navigate, isLoading, location, redirectAttempts, lastAttemptTime, isPharmacist]);

  return {
    redirected: redirected.current,
  };
};
