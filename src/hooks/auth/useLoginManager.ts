
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);
  const initialPathChecked = useRef(false);

  // Handle role-based redirects
  useEffect(() => {
    // Skip redirects if we're not on the auth pages, we're already on a proper route,
    // or if we've already performed a redirect, or if we're still loading
    if (isLoading || !isAuthenticated || !profile || redirected.current) {
      console.log("[LoginManager] Not ready for redirect yet:", { 
        isLoading, 
        isAuthenticated, 
        hasProfile: !!profile, 
        alreadyRedirected: redirected.current 
      });
      return;
    }
    
    // Prevent redirect loops by checking if we're already on a valid dashboard path
    const currentPath = location.pathname;
    const isAlreadyOnValidRoute = 
      currentPath === '/dashboard' || 
      currentPath.includes('/dashboard') || 
      currentPath.includes('/doctor') || 
      currentPath.includes('/pharmacy') ||
      currentPath.includes('/superadmin');
    
    // Only redirect from login/signup pages, not from dashboard pages
    const isOnAuthPage = 
      currentPath === '/login' || 
      currentPath === '/signup' || 
      currentPath === '/';
    
    if (isAlreadyOnValidRoute && !isOnAuthPage) {
      console.log("[LoginManager] Already on valid route, skipping redirect:", currentPath);
      redirected.current = true;
      initialPathChecked.current = true;
      return;
    }
    
    if (!isOnAuthPage && !initialPathChecked.current) {
      console.log("[LoginManager] Not on auth page, skipping redirect:", currentPath);
      initialPathChecked.current = true;
      return;
    }

    const role = profile.role;
    const route = getDashboardRouteByRole(role);

    console.log("[LoginManager] Redirecting user to:", route, "with role:", role);
    console.log("[LoginManager] Full profile data:", profile);
    
    redirected.current = true;
    initialPathChecked.current = true;
    navigate(route, { replace: true });
    
    // Log after navigation attempt
    console.log("[LoginManager] Navigation triggered, redirected state:", redirected.current);
    
    // Add a timer to detect if we're still on the page after redirect attempt
    setTimeout(() => {
      console.log("[LoginManager] Post-redirect check - Current URL:", window.location.href);
    }, 500);
  }, [isAuthenticated, profile, navigate, isLoading, location.pathname]);

  return {
    redirected: redirected.current,
  };
};
