
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

  // Improved navigation handler for all roles
  const navigateToLink = (path: string) => {
    console.log(`navigateToLink called with path: ${path}`);
    
    if (userRole === 'pharmacist') {
      // Check if the path is already properly formatted for pharmacy view
      if (path.includes('/dashboard?view=pharmacy&section=')) {
        console.log('Already properly formatted pharmacy path:', path);
        navigate(path);
        return;
      }
      
      // For pharmacists, transform the navigation to use the pharmacy view structure
      if (path === '/dashboard') {
        console.log('Navigating to pharmacy dashboard');
        navigate('/dashboard?view=pharmacy&section=dashboard');
        return;
      } else if (path === '/settings') {
        console.log('Navigating to pharmacy settings');
        navigate('/dashboard?view=pharmacy&section=settings');
        return;
      } else if (path.includes('view=profile')) {
        console.log('Navigating to pharmacy profile');
        const profileTab = new URLSearchParams(path.split('?')[1]).get('profileTab') || 'personal';
        navigate(`/dashboard?view=pharmacy&section=profile&profileTab=${profileTab}`);
        return;
      } else if (path.includes('view=orders')) {
        console.log('Navigating to pharmacy orders');
        const ordersTab = new URLSearchParams(path.split('?')[1]).get('ordersTab') || 'orders';
        navigate(`/dashboard?view=pharmacy&section=orders&ordersTab=${ordersTab}`);
        return;
      } else if (path.includes('view=prescriptions')) {
        console.log('Navigating to pharmacy prescriptions');
        navigate('/dashboard?view=pharmacy&section=prescriptions');
        return;
      }
    }
    
    // Default navigation for other roles
    console.log(`Standard navigation to: ${path}`);
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
