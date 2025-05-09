
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const usePharmacyNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for managing collapsible sidebar sections
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  
  // Navigation handlers
  const navigateToDashboard = useCallback(() => {
    console.log('Navigating to pharmacy dashboard main view');
    navigate('/pharmacy/dashboard', { 
      state: { preserveAuth: true, keepSidebar: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPharmacyProfile = useCallback(() => {
    console.log('Navigating to pharmacy profile');
    navigate('/pharmacy/profile', { 
      state: { preserveAuth: true, keepSidebar: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPharmacyPatientsPage = useCallback(() => {
    console.log('Navigating to pharmacy patients page');
    navigate('/pharmacy/patients', {
      state: { preserveAuth: true, keepSidebar: true },
      replace: false
    });
  }, [navigate]);

  const navigateToReferral = useCallback(() => {
    console.log('Navigating to referral page');
    navigate('/referral', { 
      state: { preserveAuth: true, keepSidebar: true },
      replace: false
    });
  }, [navigate]);
  
  const navigateToBilling = useCallback(() => {
    console.log('Navigating to billing details');
    navigate('/billing-details', { 
      state: { preserveAuth: true, showHeader: false, keepSidebar: true },
      replace: false
    });
  }, [navigate]);

  const navigateToSettings = useCallback(() => {
    console.log('Navigating to settings page');
    navigate('/pharmacy/dashboard?section=settings', { 
      state: { preserveAuth: true, keepSidebar: true },
      replace: false
    });
  }, [navigate]);

  const navigateToLink = useCallback((path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path, { 
      state: { preserveAuth: true, keepSidebar: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPharmacySection = useCallback((section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy section: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (tab && tabParam) {
      navigate(`/pharmacy/dashboard?section=${section}&${tabParam}=${tab}`, { 
        state: { preserveAuth: true, keepSidebar: true },
        replace: false
      });
    } else {
      navigate(`/pharmacy/dashboard?section=${section}`, { 
        state: { preserveAuth: true, keepSidebar: true },
        replace: false
      });
    }
  }, [navigate]);

  return {
    navigateToPharmacySection,
    navigateToPharmacyProfile,
    navigateToReferral,
    navigateToSettings,
    navigateToBilling,
    navigateToLink,
    navigateToDashboard,
    navigateToPharmacyPatientsPage,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    isProfilePage: location.pathname.includes('/pharmacy/profile'),
    isDashboardPage: location.pathname === '/pharmacy/dashboard' || (location.pathname.includes('/pharmacy/dashboard') && !location.search)
  };
};

export default usePharmacyNavigation;
