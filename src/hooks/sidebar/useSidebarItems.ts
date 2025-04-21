import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { profileSubItems } from "@/components/sidebar/config/sidebarNavItems";

export const useSidebarItems = () => {
  const { userRole } = useAuth();
  const location = useLocation();

  const getFilteredProfileSubItems = () => {
    // For doctors, show all profile items except pharmacy-specific ones and patient-specific ones
    if (userRole === 'doctor') {
      return profileSubItems.filter(item => 
        !['Default Pharmacy', 'My Doctor'].includes(item.label)
      );
    }
    
    // For pharmacists, show all profile items except doctor-specific ones and patient-specific ones
    if (userRole === 'pharmacist') {
      return profileSubItems.filter(item => {
        if (item.label === 'Workplace' || item.label === 'Default Pharmacy' || item.label === 'My Doctor') {
          return false;
        }
        
        // Special case for Stamp & Signature to use pharmacist path
        if (item.label === 'Stamp & Signature') {
          return true; // Keep it and we'll modify the path
        }
        
        return true;
      }).map(item => {
        // Make a copy of the item to avoid modifying the original
        if (item.label === 'Stamp & Signature') {
          return {
            ...item,
            path: '/dashboard?view=profile&profileTab=stampSignature'
          };
        }
        return item;
      });
    }
    
    // For patients, include personal details, addresses, next of kin, default pharmacy, and my doctor
    return profileSubItems.filter(item => 
      !['Stamp & Signature', 'Workplace'].includes(item.label)
    );
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
