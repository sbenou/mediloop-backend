
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const useSidebarNavigation = (userRole: string) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  useEffect(() => {
    if (location.pathname.includes('/my-orders') || location.search.includes('view=orders')) {
      setIsOrdersOpen(true);
    }
    
    if (location.pathname.includes('/profile') || location.search.includes('view=profile')) {
      setIsProfileOpen(true);
    }
  }, [location]);

  // Improved function to check if a link is active for pharmacists 
  const isPharmacistSectionActive = (sectionName: string) => {
    if (userRole !== 'pharmacist') return false;
    
    const section = searchParams.get('section');
    return section === sectionName;
  };

  // Improved function to check if a link is active for pharmacists with tab
  const isPharmacistTabActive = (sectionName: string, tabParam: string, tabValue: string) => {
    if (userRole !== 'pharmacist') return false;
    
    const section = searchParams.get('section');
    const tab = searchParams.get(tabParam);
    
    return section === sectionName && tab === tabValue;
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const isSubPathActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const isBasePathMatch = location.pathname === basePath;
      
      if (!isBasePathMatch) return false;
      
      const searchParams = new URLSearchParams(queryString);
      const currentSearchParams = new URLSearchParams(location.search);
      
      for (const [key, value] of searchParams.entries()) {
        if (currentSearchParams.get(key) !== value) {
          return false;
        }
      }
      
      return true;
    }
    
    return location.pathname === path;
  };

  // Comprehensive navigation handler for all roles
  const navigateToLink = (path: string) => {
    if (userRole === 'pharmacist') {
      // For pharmacists, transform the navigation to use the pharmacy view structure
      if (path === '/dashboard') {
        // Dashboard
        navigate('/dashboard?view=pharmacy&section=dashboard');
        return;
      } else if (path === '/settings') {
        // Settings
        navigate('/dashboard?view=pharmacy&section=settings');
        return;
      } else if (path.includes('view=profile')) {
        // Profile pages
        const profileTab = new URLSearchParams(path.split('?')[1]).get('profileTab') || 'personal';
        navigate(`/dashboard?view=pharmacy&section=profile&profileTab=${profileTab}`);
        return;
      } else if (path.includes('view=orders')) {
        // Orders pages
        const ordersTab = new URLSearchParams(path.split('?')[1]).get('ordersTab') || 'orders';
        navigate(`/dashboard?view=pharmacy&section=orders&ordersTab=${ordersTab}`);
        return;
      } else if (path.includes('view=prescriptions')) {
        // Prescriptions
        navigate('/dashboard?view=pharmacy&section=prescriptions');
        return;
      } else if (path.includes('view=patients') || path.includes('section=patients')) {
        // Patients
        navigate('/dashboard?view=pharmacy&section=patients');
        return;
      }
    }
    
    // Default navigation for other roles
    navigate(path);
  };

  return {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isPharmacistSectionActive,
    isPharmacistTabActive,
    isLinkActive,
    isSubPathActive,
    navigateToLink
  };
};
