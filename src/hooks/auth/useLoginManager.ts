
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

/**
 * This hook monitors authentication state and helps determine if 
 * the user is already on a valid route or being redirected
 */
export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const location = useLocation();
  const redirected = useRef(false);
  const initialPathChecked = useRef(false);
  const [navigationInProgress, setNavigationInProgress] = useState(false);

  // Handle role-based route validation
  useEffect(() => {
    // Skip checks if we're not ready
    if (isLoading || !isAuthenticated || !profile || redirected.current || navigationInProgress) {
      console.log("[LoginManager] Not ready for route validation:", { 
        isLoading, 
        isAuthenticated, 
        hasProfile: !!profile, 
        alreadyRedirected: redirected.current,
        navigationInProgress
      });
      return;
    }
    
    // Check if we're already on a valid route
    const currentPath = location.pathname;
    const isAlreadyOnValidRoute = 
      currentPath === '/dashboard' || 
      currentPath.includes('/dashboard') || 
      currentPath.includes('/doctor') || 
      currentPath.includes('/pharmacy') ||
      currentPath.includes('/superadmin');
    
    const isOnAuthPage = 
      currentPath === '/login' || 
      currentPath === '/signup' || 
      currentPath === '/';
    
    if (isAlreadyOnValidRoute && !isOnAuthPage) {
      console.log("[LoginManager] Already on valid route, validation complete:", currentPath);
      redirected.current = true;
      initialPathChecked.current = true;
    } else if (!isOnAuthPage && !initialPathChecked.current) {
      console.log("[LoginManager] Not on auth page, validation complete:", currentPath);
      initialPathChecked.current = true;
    }
  }, [isAuthenticated, profile, isLoading, location.pathname, navigationInProgress]);

  return {
    redirected: redirected.current,
    navigationInProgress,
    setNavigationInProgress
  };
};
