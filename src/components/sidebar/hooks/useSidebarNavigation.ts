
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const useSidebarNavigation = (userRole: string) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  useEffect(() => {
    // Set initial expansion state based on the URL
    if (location.pathname.includes('/my-orders') || 
        location.search.includes('view=orders') || 
        location.search.includes('section=orders')) {
      setIsOrdersOpen(true);
    }
    
    if (location.pathname.includes('/profile') || 
        location.search.includes('view=profile') || 
        location.search.includes('section=profile')) {
      setIsProfileOpen(true);
    }
  }, [location]);

  // Navigate to a link with special handling for different roles
  const navigateToLink = (path: string) => {
    console.log(`navigateToLink called with path: ${path}, userRole: ${userRole}`);
    
    // Always use /dashboard as the base path for in-app navigation
    const basePath = "/dashboard";
    
    // Make sure we stay on the dashboard page for all in-app navigation
    if (userRole === 'pharmacist') {
      if (path.includes('?view=pharmacy&section=')) {
        // Already properly formatted pharmacy path
        navigate(basePath + path.substring(path.indexOf('?')), { replace: true });
        return;
      }
      
      // Transform regular paths to pharmacy view structure for pharmacists
      if (path.includes('/dashboard')) {
        navigate(`${basePath}?view=pharmacy&section=dashboard`, { replace: true });
        return;
      } else if (path.includes('/settings')) {
        navigate(`${basePath}?view=pharmacy&section=settings`, { replace: true });
        return;
      } else if (path.includes('profile')) {
        const profileTab = path.includes('profileTab=') 
          ? new URLSearchParams(path.substring(path.indexOf('?'))).get('profileTab') || 'personal'
          : 'personal';
        navigate(`${basePath}?view=pharmacy&section=profile&profileTab=${profileTab}`, { replace: true });
        return;
      } else if (path.includes('orders')) {
        const ordersTab = path.includes('ordersTab=') 
          ? new URLSearchParams(path.substring(path.indexOf('?'))).get('ordersTab') || 'orders' 
          : 'orders';
        navigate(`${basePath}?view=pharmacy&section=orders&ordersTab=${ordersTab}`, { replace: true });
        return;
      } else if (path.includes('prescriptions')) {
        navigate(`${basePath}?view=pharmacy&section=prescriptions`, { replace: true });
        return;
      } else if (path.includes('patients')) {
        navigate(`${basePath}?view=pharmacy&section=patients`, { replace: true });
        return;
      }
    } else if (userRole === 'doctor') {
      if (path.includes('?view=doctor&section=')) {
        // Already properly formatted doctor path
        navigate(basePath + path.substring(path.indexOf('?')), { replace: true });
        return;
      }
      
      // Transform regular paths to doctor view structure for doctors
      if (path.includes('/dashboard')) {
        navigate(`${basePath}?view=doctor&section=dashboard`, { replace: true });
        return;
      } else if (path.includes('/settings')) {
        navigate(`${basePath}?view=doctor&section=settings`, { replace: true });
        return;
      } else if (path.includes('profile')) {
        const profileTab = path.includes('profileTab=') 
          ? new URLSearchParams(path.substring(path.indexOf('?'))).get('profileTab') || 'personal'
          : 'personal';
        navigate(`${basePath}?view=doctor&section=profile&profileTab=${profileTab}`, { replace: true });
        return;
      } else if (path.includes('patients')) {
        navigate(`${basePath}?view=doctor&section=patients`, { replace: true });
        return;
      } else if (path.includes('prescriptions')) {
        navigate(`${basePath}?view=doctor&section=prescriptions`, { replace: true });
        return;
      } else if (path.includes('teleconsultations')) {
        navigate(`${basePath}?view=doctor&section=teleconsultations`, { replace: true });
        return;
      }
    } else if (userRole === 'patient') {
      // For patient, just update the view parameter
      if (path === '/dashboard') {
        navigate(`${basePath}?view=home`, { replace: true });
        return;
      } else if (path.includes('?view=')) {
        navigate(basePath + path.substring(path.indexOf('?')), { replace: true });
        return;
      }
    }
    
    // Default: if path contains query params, preserve them
    if (path.includes('?')) {
      navigate(basePath + path.substring(path.indexOf('?')), { replace: true });
    } else {
      // If it's a full path to a different page (not in-app navigation), use standard navigation
      navigate(path, { replace: path.startsWith('/dashboard') });
    }
  };

  // Function to check if a specific section is active
  const isSectionActive = (sectionName: string, userRole: string) => {
    if (userRole === 'pharmacist' || userRole === 'doctor') {
      const section = searchParams.get('section');
      return section === sectionName;
    } else {
      const view = searchParams.get('view');
      return view === sectionName;
    }
  };

  // Function to check if a tab is active
  const isTabActive = (sectionName: string, tabParam: string, tabValue: string, userRole: string) => {
    if (!isSectionActive(sectionName, userRole)) return false;
    
    const tab = searchParams.get(tabParam);
    return tab === tabValue || (!tab && tabValue === 'default');
  };

  return {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    navigateToLink,
    isSectionActive,
    isTabActive
  };
};
