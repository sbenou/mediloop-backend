
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";
import { toast } from "@/components/ui/use-toast";

export const useLoginManager = () => {
  const { isAuthenticated, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);
  const initialPathChecked = useRef(false);
  const redirectAttempts = useRef(0);
  const navigationTimeout = useRef<NodeJS.Timeout>();
  const [navigationInProgress, setNavigationInProgress] = useState(false);

  // Clear any existing navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
    };
  }, []);

  // Handle role-based redirects
  useEffect(() => {
    // Skip redirects if we're not ready
    if (isLoading || !isAuthenticated || !profile || redirected.current || navigationInProgress) {
      console.log("[LoginManager] Not ready for redirect yet:", { 
        isLoading, 
        isAuthenticated, 
        hasProfile: !!profile, 
        alreadyRedirected: redirected.current,
        navigationInProgress
      });
      return;
    }

    // Prevent excessive redirect attempts
    if (redirectAttempts.current >= 2) {
      console.log("[LoginManager] Too many redirect attempts, skipping further redirects");
      redirected.current = true;
      return;
    }
    
    redirectAttempts.current += 1;
    
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
    
    // Set navigation state to prevent concurrent redirect attempts
    setNavigationInProgress(true);
    
    // Set redirect flag before navigation
    redirected.current = true;
    initialPathChecked.current = true;
    
    // Clear any existing timeout
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
    }

    // Store a flag to avoid multiple redirects
    sessionStorage.setItem('dashboard_redirect_performed', 'true');
    
    // Add a small delay before navigation to avoid race conditions
    navigationTimeout.current = setTimeout(() => {
      try {
        navigate(route, { replace: true });
        console.log("[LoginManager] Navigation triggered to:", route);
        
        // Check if navigation succeeded after a short delay
        setTimeout(() => {
          const currentLocation = window.location.href;
          console.log("[LoginManager] Post-redirect check - Current URL:", currentLocation);
          
          // If we're still not at the expected route, try a direct window.location approach
          if (!currentLocation.includes(route.split('?')[0])) {
            console.log("[LoginManager] React Router navigation may have failed, trying direct location change");
            
            // For dashboard routes, use direct navigation as a last resort
            if (route.includes('dashboard')) {
              window.location.href = route;
            }
          }
          
          setNavigationInProgress(false);
        }, 300);
      } catch (error) {
        console.error("[LoginManager] Navigation error:", error);
        toast({
          title: "Navigation error",
          description: "There was a problem navigating to your dashboard. Please try again.",
          variant: "destructive",
        });
        setNavigationInProgress(false);
      }
    }, 100);
    
  }, [isAuthenticated, profile, navigate, isLoading, location.pathname]);

  return {
    redirected: redirected.current,
    navigationInProgress,
  };
};
