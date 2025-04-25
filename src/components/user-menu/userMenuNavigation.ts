
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
    
    // For direct paths and special cases, use location.href for more reliable navigation
    if (path === '/dashboard' || path.includes('dashboard')) {
      console.log("Using direct navigation for dashboard path");
      window.location.href = path;
      return;
    }
    
    // Account page: special state for header
    if (path === '/account') {
      navigate('/account', { state: { showHeader: false } });
      return;
    }
    
    // For all other paths, use React Router
    navigate(path);
    
  }, [location.pathname, navigate]);

  return { handleNavigation };
}

export default useUserMenuNavigation;
