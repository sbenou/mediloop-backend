
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
    
    // For pharmacy and dashboard routes, use navigate with replace to maintain state
    if ((isPharmacist || userRole === 'pharmacist') && 
        (path.includes('dashboard') || path.includes('pharmacy'))) {
      console.log("Using pharmacy-specific navigation for:", path);
      
      // For pharmacy users, ensure the correct query params
      const pharmacyPath = path.includes('?view=pharmacy') ? 
        path : 
        '/dashboard?view=pharmacy&section=dashboard';
      
      // Use replace: true to avoid back button issues
      navigate(pharmacyPath, { replace: true, state: { fromPharmacy: true } });
      return;
    }
    
    // For pharmacy routes, use navigate with replace
    if (path.includes('pharmacy') || path === '/dashboard?view=pharmacy&section=dashboard') {
      console.log("Using replace navigation for pharmacy path:", path);
      navigate(path, { replace: true });
      return;
    }
    
    // For regular dashboard paths, use navigate with replace to avoid state issues
    if (path === '/dashboard' || path.includes('dashboard')) {
      console.log("Using replace navigation for dashboard path:", path);
      navigate(path, { replace: true });
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
