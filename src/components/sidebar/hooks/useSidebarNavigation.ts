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

  // Function to check if a pharmacy section is active
  const isPharmacistSectionActive = (sectionName: string) => {
    if (userRole !== 'pharmacist') return false;
    
    // For pharmacist views, check the section parameter
    const section = searchParams.get('section');
    const isPharmacyView = location.search.includes('view=pharmacy');
    
    return isPharmacyView && section === sectionName;
  };

  // Function to check if a pharmacy tab is active
  const isPharmacistTabActive = (sectionName: string, tabParam: string, tabValue: string) => {
    if (userRole !== 'pharmacist') return false;
    
    // For pharmacist views, check both section and tab parameters
    const section = searchParams.get('section');
    const tab = searchParams.get(tabParam);
    const isPharmacyView = location.search.includes('view=pharmacy');
    
    return isPharmacyView && section === sectionName && tab === tabValue;
  };

  // Check if a specific link is active
  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  // Check if a path with query parameters is active
  const isSubPathActive = (path: string) => {
    if (path.includes('?')) {
      const [basePath, queryString] = path.split('?');
      const isBasePathMatch = location.pathname === basePath;
      
      if (!isBasePathMatch) return false;
      
      const pathSearchParams = new URLSearchParams(queryString);
      const currentSearchParams = new URLSearchParams(location.search);
      
      for (const [key, value] of pathSearchParams.entries()) {
        if (currentSearchParams.get(key) !== value) {
          return false;
        }
      }
      
      return true;
    }
    
    return location.pathname === path;
  };

  // Navigate to a link with special handling for different roles
  const navigateToLink = (path: string) => {
    console.log(`navigateToLink called with path: ${path}, userRole: ${userRole}`);
    
    // Make sure we stay on the dashboard page for all in-app navigation
    // This ensures views are loaded in the middle section, not as separate pages
    if (userRole === 'pharmacist') {
      // If the path is already properly formatted for pharmacy view, use it directly
      if (path.includes('/dashboard?view=pharmacy&section=')) {
        console.log('Using properly formatted pharmacy path:', path);
        navigate(path, { replace: true });
        return;
      }
      
      // Transform regular paths to pharmacy view structure for pharmacists
      if (path === '/dashboard') {
        console.log('Navigating to pharmacy dashboard');
        navigate('/dashboard?view=pharmacy&section=dashboard', { replace: true });
        return;
      } else if (path === '/settings') {
        console.log('Navigating to pharmacy settings');
        navigate('/dashboard?view=pharmacy&section=settings', { replace: true });
        return;
      } else if (path.includes('view=profile')) {
        console.log('Navigating to pharmacy profile');
        const profileTab = new URLSearchParams(path.split('?')[1]).get('profileTab') || 'personal';
        navigate(`/dashboard?view=pharmacy&section=profile&profileTab=${profileTab}`, { replace: true });
        return;
      } else if (path.includes('view=orders')) {
        console.log('Navigating to pharmacy orders');
        const ordersTab = new URLSearchParams(path.split('?')[1]).get('ordersTab') || 'orders';
        navigate(`/dashboard?view=pharmacy&section=orders&ordersTab=${ordersTab}`, { replace: true });
        return;
      } else if (path.includes('view=prescriptions') || path === '/dashboard?view=prescriptions') {
        console.log('Navigating to pharmacy prescriptions');
        navigate('/dashboard?view=pharmacy&section=prescriptions', { replace: true });
        return;
      } else if (path.includes('view=patients') || path === '/dashboard?view=patients') {
        console.log('Navigating to pharmacy patients');
        navigate('/dashboard?view=pharmacy&section=patients', { replace: true });
        return;
      }
    } else if (userRole === 'doctor') {
      // Transform regular paths to doctor view structure for doctors
      if (path === '/dashboard') {
        console.log('Navigating to doctor dashboard');
        navigate('/dashboard?view=doctor&section=dashboard', { replace: true });
        return;
      } else if (path.includes('view=profile')) {
        console.log('Navigating to doctor profile');
        const profileTab = new URLSearchParams(path.split('?')[1]).get('profileTab') || 'personal';
        navigate(`/dashboard?view=doctor&section=profile&profileTab=${profileTab}`, { replace: true });
        return;
      } else if (path.includes('view=patients')) {
        console.log('Navigating to doctor patients');
        navigate('/dashboard?view=doctor&section=patients', { replace: true });
        return;
      } else if (path.includes('view=prescriptions')) {
        console.log('Navigating to doctor prescriptions');
        navigate('/dashboard?view=doctor&section=prescriptions', { replace: true });
        return;
      } else if (path.includes('view=teleconsultations')) {
        console.log('Navigating to doctor teleconsultations');
        navigate('/dashboard?view=doctor&section=teleconsultations', { replace: true });
        return;
      } else if (path.includes('view=settings')) {
        console.log('Navigating to doctor settings');
        navigate('/dashboard?view=doctor&section=settings', { replace: true });
        return;
      }
    } else {
      // For patient role, keep them on dashboard but change the view
      if (path.startsWith('/dashboard?view=')) {
        console.log(`Standard navigation with replace: ${path}`);
        navigate(path, { replace: true });
        return;
      }
    }
    
    // Default navigation for other paths
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
