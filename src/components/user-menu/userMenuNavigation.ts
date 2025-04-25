
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

export function useUserMenuNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActivitiesPage = location.pathname.includes('/activities') || location.pathname.includes('/notifications');

  const handleNavigation = useCallback((path: string) => {
    console.log("Navigation requested to:", path);
    
    // Prevent unnecessary navigation if we're already on the same path
    if (location.pathname === path && !path.includes("?")) {
      console.log("Already on this path, skipping navigation");
      return;
    }
    
    // Dashboard with query params
    if (path.startsWith('/dashboard?')) {
      console.log("Navigating to dashboard with params:", path);
      navigate(path);
      return;
    }
    
    // Account page: special state for header
    if (path === '/account') {
      navigate('/account', { state: { showHeader: false } });
      return;
    }
    
    // For all other paths, use standard navigation
    navigate(path);
    
  }, [location.pathname, navigate]);

  return { handleNavigation };
}

export default useUserMenuNavigation;
