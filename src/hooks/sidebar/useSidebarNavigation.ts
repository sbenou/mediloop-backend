
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useDashboardParams from '@/hooks/dashboard/useDashboardParams';

export const useSidebarNavigation = (userRole: string) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { params, updateParams } = useDashboardParams();
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConsultationsOpen, setIsConsultationsOpen] = useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const [isWorkplacesOpen, setIsWorkplacesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  
  // Check if we're on the activities or notifications page
  const isActivitiesPage = location.pathname.includes('/activities') || 
                          location.pathname.includes('/notifications');
  
  // Check if we're on the account page
  const isAccountPage = location.pathname.includes('/account');
  
  // Determine if a section is expanded based on URL
  useEffect(() => {
    // Set initial expansion state based on the URL and role
    if (userRole === 'doctor' || userRole === 'pharmacist') {
      if (params.section === 'orders') {
        setIsOrdersOpen(true);
      }
      
      if (params.section === 'profile') {
        setIsProfileOpen(true);
      }
      
      if (params.section === 'teleconsultations' || params.section === 'appointments') {
        setIsConsultationsOpen(true);
      }

      if (params.section === 'activities') {
        setIsActivitiesOpen(true);
      }
      
      if (params.section === 'workplaces') {
        setIsWorkplacesOpen(true);
      }
      
      if (isAccountPage) {
        setIsAccountOpen(true);
      }
    } else {
      // For patients and other roles
      if (params.view === 'orders') {
        setIsOrdersOpen(true);
      }
      
      if (params.view === 'profile') {
        setIsProfileOpen(true);
      }
      
      if (params.view === 'teleconsultations' || params.view === 'appointments') {
        setIsConsultationsOpen(true);
      }

      if (params.view === 'activities') {
        setIsActivitiesOpen(true);
      }
      
      if (isAccountPage) {
        setIsAccountOpen(true);
      }
    }
  }, [location, params.section, params.view, userRole, isAccountPage]);

  // Navigate to a link with special handling for different roles
  const navigateToLink = (path: string) => {
    console.log(`navigateToLink called with path: ${path}, userRole: ${userRole}, isActivitiesPage: ${isActivitiesPage}`);
    
    // Special case for /account - ALWAYS navigate directly 
    if (path === '/account') {
      console.log('Direct navigation to /account page');
      window.location.href = '/account';
      return;
    }
    
    // For direct paths like /settings, navigate directly
    if (path.startsWith('/') && !path.includes('?')) {
      navigate(path);
      return;
    }
    
    // Always use /dashboard as the base path for in-app navigation
    const basePath = "/dashboard";
    
    // Check if the path contains query parameters
    const hasQueryParams = path.includes('?');
    if (!hasQueryParams) {
      // If no query params, navigate directly
      navigate(path);
      return;
    }
    
    // Extract query parameters from the path
    const queryString = path.substring(path.indexOf('?') + 1);
    const queryParams = new URLSearchParams(queryString);
    const paramsObject: Record<string, string> = {};
    
    // Convert query params to object
    queryParams.forEach((value, key) => {
      paramsObject[key] = value;
    });
    
    // Handle role-specific navigation
    if (userRole === 'pharmacist') {
      // For pharmacists, always set view=pharmacy and handle section
      if (!paramsObject.view) {
        paramsObject.view = 'pharmacy';
      }
      
      // Ensure a section is specified (default to dashboard)
      if (!paramsObject.section) {
        paramsObject.section = 'dashboard';
      }
    } else if (userRole === 'doctor') {
      // For doctors, always set view=doctor and handle section
      if (!paramsObject.view) {
        paramsObject.view = 'doctor';
      }
      
      // Ensure a section is specified (default to dashboard)
      if (!paramsObject.section) {
        paramsObject.section = 'dashboard';
      }
    }
    
    // If on activities page, navigate to dashboard with the query parameters
    if (isActivitiesPage) {
      console.log('Navigating from activities page to dashboard with params:', paramsObject);
      navigate(`${basePath}?${new URLSearchParams(paramsObject).toString()}`);
      return;
    }
    
    // Update the URL parameters and stay on the dashboard
    updateParams(paramsObject);
  };

  // Function to check if a specific section is active
  const isSectionActive = (sectionName: string) => {
    if (userRole === 'pharmacist' || userRole === 'doctor') {
      return params.section === sectionName;
    } else {
      return params.view === sectionName;
    }
  };

  // Function to check if a tab is active
  const isTabActive = (sectionName: string, tabParam: string, tabValue: string) => {
    if (!isSectionActive(sectionName)) return false;
    
    const tabParamValue = tabParam === 'profileTab' ? params.profileTab : 
                          tabParam === 'ordersTab' ? params.ordersTab : 
                          '';
                          
    return tabParamValue === tabValue || (!tabParamValue && tabValue === 'default');
  };

  // Function to check if a specific path is active
  const isLinkActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    if (path === '/account') {
      return location.pathname === '/account';
    }
    return location.pathname.includes(path);
  };

  // Functions specifically for the pharmacist view
  const isPharmacistSectionActive = (section: string) => {
    return userRole === 'pharmacist' && 
           params.view === 'pharmacy' && 
           params.section === section;
  };

  const isPharmacistTabActive = (section: string, tabParam: string, tabValue: string) => {
    if (!isPharmacistSectionActive(section)) return false;
    
    const tabParamValue = tabParam === 'profileTab' ? params.profileTab : 
                          tabParam === 'ordersTab' ? params.ordersTab : 
                          '';
                          
    return tabParamValue === tabValue || (!tabParamValue && tabValue === 'default');
  };

  return {
    isOrdersOpen,
    setIsOrdersOpen,
    isProfileOpen,
    setIsProfileOpen,
    isConsultationsOpen,
    setIsConsultationsOpen,
    isActivitiesOpen,
    setIsActivitiesOpen,
    isWorkplacesOpen,
    setIsWorkplacesOpen,
    isAccountOpen,
    setIsAccountOpen,
    navigateToLink,
    isSectionActive,
    isTabActive,
    isLinkActive,
    isPharmacistSectionActive,
    isPharmacistTabActive
  };
};

export default useSidebarNavigation;
