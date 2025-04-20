
import { useNavigate, useLocation } from "react-router-dom";

export function useUserMenuNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActivitiesPage = location.pathname.includes('/activities') || location.pathname.includes('/notifications');

  const handleNavigation = (path: string) => {
    // Prevent unnecessary navigation if we're already on the same path
    if (location.pathname === path) return;
    
    // Account page: special state for header
    if (path === '/account') {
      navigate('/account', { state: { showHeader: false } });
      return;
    }
    // For direct physical paths
    if (path.startsWith("/") && !path.includes("?")) {
      navigate(path);
      return;
    }
    // If on activities page, support navigating with query
    if (isActivitiesPage && path.startsWith("/dashboard?")) {
      navigate(path);
    } else {
      navigate(path);
    }
  };

  return { handleNavigation };
}
