
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

export function useUserMenuNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPharmacist, userRole } = useAuth();
  const isActivitiesPage = location.pathname.includes('/activities') || location.pathname.includes('/notifications');
  const navigationInProgressRef = useRef(false);

  // Reset navigation flag when location changes
  useEffect(() => {
    navigationInProgressRef.current = false;
  }, [location.pathname, location.search]);

  const handleNavigation = useCallback((path: string) => {
    console.log("Navigation requested to:", path);
    
    // Prevent duplicate navigations
    if (navigationInProgressRef.current) {
      console.log("Navigation already in progress, skipping");
      return;
    }
    
    // Prevent unnecessary navigation if we're already on the same path
    if (location.pathname === path && !path.includes("?")) {
      console.log("Already on this path, skipping navigation");
      return;
    }
    
    // Mark navigation as in progress
    navigationInProgressRef.current = true;
    
    // Special handling for dashboard paths based on role
    if (path === '/dashboard') {
      // Get the correct dashboard route based on user role
      const dashboardRoute = getDashboardRouteByRole(userRole);
      console.log(`Navigating to dashboard: ${dashboardRoute} for role: ${userRole}`);
      navigate(dashboardRoute, {
        replace: false,
        state: { preserveAuth: true, keepSidebar: true }
      });
      return;
    }
    
    // Doctor profile specific path
    if (path === '/doctor/profile') {
      navigate('/doctor/profile', {
        state: { preserveAuth: true, keepSidebar: true },
        replace: false
      });
      return;
    }
    
    // Account page: special state for header
    if (path === '/account') {
      navigate('/account', { 
        state: { showHeader: false, preserveAuth: true, keepSidebar: true },
        replace: false
      });
      return;
    }

    // For pharmacy-specific paths
    if (path.startsWith('/pharmacy/')) {
      navigate(path, {
        state: { preserveAuth: true, keepSidebar: true },
        replace: false
      });
      return;
    }

    // For billing details path - ensure preserveAuth and the sidebar stays visible
    if (path === '/billing-details' || path.includes('/billing-details')) {
      navigate(path, {
        state: { preserveAuth: true, keepSidebar: true, showHeader: false },
        replace: false
      });
      return;
    }

    // For referral path
    if (path === '/referral') {
      navigate(path, {
        state: { preserveAuth: true, keepSidebar: true },
        replace: false
      });
      return;
    }
    
    // For notifications and activities paths
    if (path === '/notifications' || path === '/activities') {
      navigate(path, {
        state: { preserveAuth: true, keepSidebar: true },
        replace: false
      });
      return;
    }
    
    // For all other paths, use standard navigation with preserved auth state
    navigate(path, {
      replace: false,
      state: { preserveAuth: true, keepSidebar: true }
    });
    
  }, [location.pathname, navigate, userRole]);

  return { handleNavigation };
}

export default useUserMenuNavigation;
