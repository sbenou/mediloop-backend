
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { profileSubItems } from "../config/sidebarNavItems";

export const useSidebarItems = () => {
  const { userRole } = useAuth();
  const location = useLocation();

  const getFilteredProfileSubItems = () => {
    // For doctors, show all profile items except pharmacy-specific ones
    if (userRole === 'doctor') {
      return profileSubItems.filter(item => 
        !['Default Pharmacy', 'My Doctor'].includes(item.label)
      );
    }
    
    // For pharmacists, show all profile items except doctor-specific ones and patient-specific ones
    if (userRole === 'pharmacist') {
      return profileSubItems.filter(item => 
        !['Default Pharmacy', 'My Doctor', 'Workplace'].includes(item.label) &&
        // Rename "Stamp & Signature" to use the right path for pharmacists
        (item.label !== 'Stamp & Signature' || (item.label === 'Stamp & Signature' && 
          { ...item, path: '/dashboard?view=profile&profileTab=stampSignature' }))
      );
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
