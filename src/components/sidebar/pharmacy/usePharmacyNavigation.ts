
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const usePharmacyNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  
  const isProfilePage = location.pathname.includes('/pharmacy/profile');
  const isDashboardPage = location.pathname.includes('/pharmacy/dashboard');

  const navigateToPharmacySection = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy section: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (tab && tabParam) {
      navigate(`/pharmacy/dashboard?section=${section}&${tabParam}=${tab}`);
    } else {
      navigate(`/pharmacy/dashboard?section=${section}`);
    }
  };

  const navigateToLink = (path: string) => {
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile from PharmacistSidebar');
    navigate('/pharmacy/profile');
  };

  const navigateToProducts = () => {
    console.log('Navigating to products page from PharmacistSidebar');
    navigate('/products');
  };

  // Add these helper methods for navigating to specific profile tabs
  const navigateToStampSignature = () => {
    navigateToPharmacySection('profile', 'stampSignature', 'profileTab');
  };

  const navigateToNextOfKin = () => {
    navigateToPharmacySection('profile', 'nextofkin', 'profileTab');
  };

  return {
    navigateToPharmacySection,
    navigateToPharmacyProfile,
    navigateToProducts,
    navigateToLink,
    navigateToStampSignature,
    navigateToNextOfKin,
    isProfilePage,
    isDashboardPage,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen
  };
};

export default usePharmacyNavigation;
