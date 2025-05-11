
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const usePharmacyNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Simplified state management - we'll get the open state from URL params
  const isProfileOpen = location.search.includes('section=profile');
  const isOrdersOpen = location.search.includes('section=orders');
  const setIsProfileOpen = useCallback((isOpen) => {
    if (isOpen && !isProfileOpen) {
      navigateToPharmacySection('profile', 'personal', 'profileTab');
    }
  }, [isProfileOpen]);
  
  const setIsOrdersOpen = useCallback((isOpen) => {
    if (isOpen && !isOrdersOpen) {
      navigateToPharmacySection('orders', 'all', 'ordersTab');
    }
  }, [isOrdersOpen]);
  
  // Navigation handlers using direct paths instead of search parameters
  const navigateToDashboard = useCallback(() => {
    console.log('Navigating to pharmacy dashboard main view');
    navigate('/pharmacy/dashboard', { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPharmacyProfile = useCallback(() => {
    console.log('Navigating to pharmacy profile');
    navigate('/pharmacy/profile', { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPrescriptions = useCallback(() => {
    console.log('Navigating to prescriptions page');
    // Instead of using search in NavigateOptions, create the URL with the search params
    const url = '/pharmacy/dashboard?section=prescriptions';
    navigate(url, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPharmacyPatientsPage = useCallback(() => {
    console.log('Navigating to pharmacy patients page');
    navigate('/pharmacy/patients', {
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToReferral = useCallback(() => {
    console.log('Navigating to referral page');
    navigate('/referral', { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);
  
  const navigateToBilling = useCallback(() => {
    console.log('Navigating to billing details');
    navigate('/billing-details', { 
      state: { preserveAuth: true, showHeader: false },
      replace: false
    });
  }, [navigate]);

  const navigateToSettings = useCallback(() => {
    console.log('Navigating to settings page');
    // Create the URL with search params instead of using the search property
    const url = '/pharmacy/dashboard?section=settings';
    navigate(url, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToLink = useCallback((path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  // Use search parameters for sections within the pharmacy dashboard
  const navigateToPharmacySection = useCallback((section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy section: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    // Create the URL with search params
    let url = `/pharmacy/dashboard?section=${section}`;
    if (tab && tabParam) {
      url += `&${tabParam}=${tab}`;
    }
    
    navigate(url, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  return {
    navigateToPharmacySection,
    navigateToPharmacyProfile,
    navigateToReferral,
    navigateToSettings,
    navigateToBilling,
    navigateToLink,
    navigateToDashboard,
    navigateToPrescriptions,
    navigateToPharmacyPatientsPage,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    isProfilePage: location.pathname.includes('/pharmacy/profile'),
    isDashboardPage: location.pathname === '/pharmacy/dashboard' || location.pathname.includes('/pharmacy/dashboard')
  };
};

export default usePharmacyNavigation;
