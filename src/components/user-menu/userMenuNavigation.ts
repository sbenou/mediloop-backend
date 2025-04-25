
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";

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
    
    // For pharmacy users, handle dashboard navigation specially
    if (isPharmacist || userRole === 'pharmacist') {
      // Special handling for pharmacy dashboard
      if (path.includes('dashboard')) {
        console.log("Using pharmacy-specific navigation for:", path);
        
        // For pharmacy dashboard, ensure we have the correct query parameters
        const searchParams = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '');
        searchParams.set('view', 'pharmacy');
        
        if (!searchParams.has('section')) {
          searchParams.set('section', 'dashboard');
        }
        
        const dashboardPath = `/dashboard?${searchParams.toString()}`;
        console.log("Navigating to pharmacy dashboard:", dashboardPath);
        
        // Use navigate with replace to avoid back-button issues
        navigate(dashboardPath, { 
          replace: true,
          state: { preserveAuth: true }
        });
        return;
      }
    }
    
    // Account page: special state for header
    if (path === '/account') {
      navigate('/account', { 
        state: { showHeader: false, preserveAuth: true },
        replace: true
      });
      return;
    }
    
    // For all other paths, use standard navigation with preserved auth state
    navigate(path, {
      replace: false,
      state: { preserveAuth: true }
    });
    
  }, [location.pathname, navigate, isPharmacist, userRole]);

  return { handleNavigation };
}

export default useUserMenuNavigation;
