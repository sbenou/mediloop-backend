
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useSidebarNavigation(userRole: string) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConsultationsOpen, setIsConsultationsOpen] = useState(false);
  const [isWorkplacesOpen, setIsWorkplacesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  
  // Get current query params
  const searchParams = new URLSearchParams(location.search);
  
  // Navigate to link based on role
  const navigateToLink = (link: string) => {
    console.log(`Navigating to ${link} for role ${userRole}`);
    
    // For direct paths like /account or /settings, navigate using React Router
    if (link.startsWith('/')) {
      navigate(link);
      return;
    }
    
    // For query param based navigation - use replace: true to prevent history stacking
    navigate(link, { replace: true });
  };

  // Function to check if a specific path is active
  const isLinkActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    
    // Specifically handle the /referral path to avoid conflicts with dashboard
    if (path === '/referral') {
      return location.pathname === '/referral';
    }
    
    return location.pathname.includes(path);
  };

  // Functions specifically for the pharmacist view
  const isPharmacistSectionActive = (section: string) => {
    return userRole === 'pharmacist' && 
           searchParams.get('view') === 'pharmacy' && 
           searchParams.get('section') === section;
  };

  const isPharmacistTabActive = (section: string, tabParam: string, tabValue: string) => {
    if (!isPharmacistSectionActive(section)) return false;
    
    const tabParamValue = tabParam === 'profileTab' ? searchParams.get('profileTab') : 
                          tabParam === 'ordersTab' ? searchParams.get('ordersTab') : 
                          '';
                          
    return tabParamValue === tabValue || (!tabParamValue && tabValue === 'default');
  };

  // Function to check if a specific section is active
  const isSectionActive = (sectionName: string) => {
    if (userRole === 'pharmacist' || userRole === 'doctor') {
      return searchParams.get('section') === sectionName;
    } else {
      return searchParams.get('view') === sectionName;
    }
  };

  // Function to check if a tab is active
  const isTabActive = (sectionName: string, tabParam: string, tabValue: string) => {
    if (!isSectionActive(sectionName)) return false;
    
    const tabParamValue = tabParam === 'profileTab' ? searchParams.get('profileTab') : 
                          tabParam === 'ordersTab' ? searchParams.get('ordersTab') : 
                          '';
                          
    return tabParamValue === tabValue || (!tabParamValue && tabValue === 'default');
  };
  
  return {
    isProfileOpen,
    setIsProfileOpen,
    isConsultationsOpen,
    setIsConsultationsOpen,
    isWorkplacesOpen,
    setIsWorkplacesOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    isActivitiesOpen,
    setIsActivitiesOpen,
    isAccountOpen,
    setIsAccountOpen,
    navigateToLink,
    isPharmacistSectionActive,
    isPharmacistTabActive,
    isSectionActive,
    isTabActive,
    isLinkActive
  };
}

export default useSidebarNavigation;
