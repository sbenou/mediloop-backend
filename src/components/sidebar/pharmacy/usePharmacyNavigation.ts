
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const usePharmacyNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  
  const isProfilePage = location.pathname.includes('/pharmacy/profile');

  const navigateToPharmacySection = (section: string, tab?: string, tabParam?: string) => {
    console.log(`Navigating to pharmacy section: ${section}${tab ? ` with ${tabParam}: ${tab}` : ''}`);
    
    if (isProfilePage) {
      if (tab && tabParam) {
        navigate(`/dashboard?view=pharmacy&section=${section}&${tabParam}=${tab}`);
      } else {
        navigate(`/dashboard?view=pharmacy&section=${section}`);
      }
      return;
    }
    
    if (tab && tabParam) {
      navigate(`/dashboard?view=pharmacy&section=${section}&${tabParam}=${tab}`);
    } else {
      navigate(`/dashboard?view=pharmacy&section=${section}`);
    }
  };

  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile from PharmacistSidebar');
    navigate('/pharmacy/profile');
  };

  const navigateToProducts = () => {
    console.log('Navigating to products page from PharmacistSidebar');
    navigate('/products');
  };

  return {
    navigateToPharmacySection,
    navigateToPharmacyProfile,
    navigateToProducts,
    isProfilePage,
    isProfileOpen,
    setIsProfileOpen,
    isOrdersOpen,
    setIsOrdersOpen
  };
};

export default usePharmacyNavigation;
