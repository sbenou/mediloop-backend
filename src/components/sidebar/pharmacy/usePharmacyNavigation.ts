
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
      replace: true
    });
  }, [navigate]);

  const navigateToPharmacyProfile = useCallback(() => {
    console.log('Navigating to pharmacy profile');
    navigate('/pharmacy/profile', { 
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
    // Fix: Separate the path from the search params
    navigate('/pharmacy/dashboard', { 
      state: { preserveAuth: true },
      replace: true
    });
    // Set the search params separately
    setTimeout(() => {
      window.history.replaceState(
        null,
        '',
        '/pharmacy/dashboard?section=settings'
      );
    }, 0);
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
    
    // Fix: Separate the path from the search params
    if (tab && tabParam) {
      navigate('/pharmacy/dashboard', { 
        state: { preserveAuth: true },
        replace: true
      });
      // Set the search params separately
      setTimeout(() => {
        window.history.replaceState(
          null,
          '',
          `/pharmacy/dashboard?section=${section}&${tabParam}=${tab}`
        );
      }, 0);
    } else {
      navigate('/pharmacy/dashboard', { 
        state: { preserveAuth: true },
        replace: true
      });
      // Set the search params separately
      setTimeout(() => {
        window.history.replaceState(
          null,
          '',
          `/pharmacy/dashboard?section=${section}`
        );
      }, 0);
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
    isDashboardPage: location.pathname === '/pharmacy/dashboard' || location.pathname.includes('/pharmacy/dashboard')
  };
};

export default usePharmacyNavigation;
