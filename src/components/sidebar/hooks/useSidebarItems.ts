
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";

export const useSidebarItems = () => {
  const { userRole } = useAuth();
  const location = useLocation();

  const getFilteredProfileSubItems = () => {
    if (userRole === 'pharmacist') {
      return profileSubItems.filter(item => !['Pharmacy', 'My Doctor'].includes(item.label));
    }
    return profileSubItems;
  };

  const showConsultationsMenu = userRole !== 'pharmacist';
  const showPrescriptionsMenu = userRole === 'patient' || userRole === 'doctor' || userRole === 'pharmacist';

  const isLinkActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search;
    }
    if (path === '/account') {
      return location.pathname === '/account';
    }
    return location.pathname.includes(path);
  };

  return {
    getFilteredProfileSubItems,
    showConsultationsMenu,
    showPrescriptionsMenu,
    isLinkActive
  };
};

