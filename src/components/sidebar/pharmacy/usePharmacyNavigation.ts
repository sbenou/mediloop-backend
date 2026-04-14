
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const usePharmacyNavigation = () => {
  const DASHBOARD_BASE = '/dashboard';
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
    navigate(DASHBOARD_BASE, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate, DASHBOARD_BASE]);

  const navigateToPharmacyProfile = useCallback(() => {
    navigate('/pharmacy/profile', { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPrescriptions = useCallback(() => {
    // Instead of using search in NavigateOptions, create the URL with the search params
    const url = `${DASHBOARD_BASE}?section=prescriptions`;
    navigate(url, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToPharmacyPatientsPage = useCallback(() => {
    navigate('/pharmacy/patients', {
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToReferral = useCallback(() => {
    navigate('/referral', { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);
  
  const navigateToBilling = useCallback(() => {
    navigate('/billing-details', { 
      state: { preserveAuth: true, showHeader: false },
      replace: false
    });
  }, [navigate]);

  const navigateToSettings = useCallback(() => {
    // Create the URL with search params instead of using the search property
    const url = `${DASHBOARD_BASE}?section=settings`;
    navigate(url, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  const navigateToLink = useCallback((path: string) => {
    navigate(path, { 
      state: { preserveAuth: true },
      replace: false
    });
  }, [navigate]);

  // Use search parameters for sections within the pharmacy dashboard
  const navigateToPharmacySection = useCallback((section: string, tab?: string, tabParam?: string) => {
    // Create the URL with search params
    let url = `${DASHBOARD_BASE}?section=${section}`;
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
    isDashboardPage: location.pathname === DASHBOARD_BASE
  };
};

export default usePharmacyNavigation;
