
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useSidebarNavigation(userRole: string) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConsultationsOpen, setIsConsultationsOpen] = useState(false);
  const [isWorkplacesOpen, setIsWorkplacesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  
  // Get current query params
  const searchParams = new URLSearchParams(location.search);
  
  // Navigate to link based on role
  const navigateToLink = (link: string) => {
    console.log(`Navigating to ${link} for role ${userRole}`);
    
    // For links that start with /, do direct navigation
    if (link.startsWith('/')) {
      navigate(link);
      return;
    }
    
    // For query param based navigation
    if (userRole === 'doctor') {
      navigate(`/dashboard${link}`);
    } else {
      navigate(`/dashboard${link}`);
    }
  };
  
  return {
    isProfileOpen,
    setIsProfileOpen,
    isConsultationsOpen,
    setIsConsultationsOpen,
    isWorkplacesOpen,
    setIsWorkplacesOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    navigateToLink
  };
}
