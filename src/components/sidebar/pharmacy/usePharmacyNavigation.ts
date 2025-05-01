
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const usePharmacyNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  
  const isProfilePage = location.pathname.includes('/pharmacy/profile');
  const isDashboardPage = location.pathname.includes('/pharmacy/dashboard');

  const navigateToPharmacySection = useCallback((section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy section: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (tab && tabParam) {
      navigate(`/pharmacy/dashboard?section=${section}&${tabParam}=${tab}`);
    } else {
      navigate(`/pharmacy/dashboard?section=${section}`);
    }
  }, [navigate]);

  const navigateToLink = useCallback((path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  }, [navigate]);

  const navigateToPharmacyProfile = useCallback(() => {
    console.log('Navigating to pharmacy profile from PharmacistSidebar');
    navigate('/pharmacy/profile');
  }, [navigate]);

  const navigateToProducts = useCallback(() => {
    console.log('Navigating to products page from PharmacistSidebar');
    navigate('/products');
  }, [navigate]);

  const navigateToStampSignature = useCallback(() => {
    navigateToPharmacySection('profile', 'stampSignature', 'profileTab');
  }, [navigateToPharmacySection]);

  const navigateToNextOfKin = useCallback(() => {
    navigateToPharmacySection('profile', 'nextofkin', 'profileTab');
  }, [navigateToPharmacySection]);

  const navigateToDashboard = useCallback(() => {
    console.log('Navigating to pharmacy dashboard main view');
    navigate('/pharmacy/dashboard?section=dashboard');
  }, [navigate]);

  return {
    navigateToPharmacySection,
    navigateToPharmacyProfile,
    navigateToProducts,
    navigateToLink,
    navigateToStampSignature,
    navigateToNextOfKin,
    navigateToDashboard,
    isProfilePage,
    isDashboardPage,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen
  };
};

export default usePharmacyNavigation;
