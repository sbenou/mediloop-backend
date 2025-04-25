
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";

export function useUserMenuNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPharmacist, userRole } = useAuth();
  const isActivitiesPage = location.pathname.includes('/activities') || location.pathname.includes('/notifications');

  const handleNavigation = useCallback((path: string) => {
    console.log("Navigation requested to:", path);
    
    // Prevent unnecessary navigation if we're already on the same path
    if (location.pathname === path && !path.includes("?")) {
      console.log("Already on this path, skipping navigation");
      return;
    }
    
    // Check if the user is a pharmacist
    if (isPharmacist || userRole === 'pharmacist') {
      console.log("Using pharmacy-specific navigation for:", path);
      
      // For pharmacy users, always use direct navigation to preserve state
      if (path.includes('dashboard') || path.includes('pharmacy')) {
        const pharmacyPath = path.includes('?view=pharmacy') ? 
          path : 
          '/dashboard?view=pharmacy&section=dashboard';
        
        window.location.href = pharmacyPath;
        return;
      }
    }
    
    // Always use direct navigation for pharmacy routes to avoid state issues
    if (path.includes('pharmacy') || path === '/dashboard?view=pharmacy&section=dashboard') {
      console.log("Using direct navigation for pharmacy path:", path);
      window.location.href = path;
      return;
    }
    
    // For regular dashboard paths, use direct navigation to avoid partial state issues
    if (path === '/dashboard' || path.includes('dashboard')) {
      console.log("Using direct navigation for dashboard path:", path);
      window.location.href = path;
      return;
    }
    
    // Account page: special state for header
    if (path === '/account') {
      navigate('/account', { state: { showHeader: false } });
      return;
    }
    
    // For all other paths, use standard navigation
    navigate(path);
    
  }, [location.pathname, navigate, isPharmacist, userRole]);

  return { handleNavigation };
}

export default useUserMenuNavigation;
