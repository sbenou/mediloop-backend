
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarBrand from "./SidebarBrand";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import PharmacistNavigation from "./pharmacy/PharmacistNavigation";

interface PharmacistSidebarProps {
  canViewProducts?: boolean;
  canEditProducts?: boolean;
  canManageStaff?: boolean;
  canManagePrescriptions?: boolean;
  canViewPrescriptions?: boolean;
}

const PharmacistSidebar = ({
  canViewProducts = true,
  canEditProducts = false,
  canManageStaff = false,
  canManagePrescriptions = true,
  canViewPrescriptions = true  // Always visible
}: PharmacistSidebarProps) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  // Direct navigation functions - avoid using parameterized routes
  const navigateToPharmacyProfile = () => {
    console.log("Navigating to pharmacy profile");
    navigate('/pharmacy/profile', { 
      state: { preserveAuth: true },
      replace: false 
    });
  };

  const navigateToPharmacyDashboard = () => {
    console.log("Navigating to pharmacy dashboard");
    navigate('/pharmacy/dashboard', { 
      state: { preserveAuth: true },
      replace: false 
    });
  };
  
  const navigateToBilling = () => {
    navigate('/billing-details', { 
      state: { preserveAuth: true, showHeader: false },
      replace: false 
    });
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade', { 
      state: { preserveAuth: true },
      replace: false 
    });
  };

  const navigateToAccount = () => {
    navigate('/account', { 
      state: { showHeader: false, preserveAuth: true },
      replace: false 
    });
  };
  
  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <PharmacistNavigation 
          canViewProducts={canViewProducts}
          canEditProducts={canEditProducts}
          canManagePrescriptions={canManagePrescriptions}
          canViewPrescriptions={true} // Always true to ensure always visible
        />
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole="pharmacist"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        handleFileChange={handleFileChange}
        navigateToAccount={navigateToAccount}
        navigateToPharmacyDashboard={navigateToPharmacyDashboard}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
      />
    </aside>
  );
};

export default PharmacistSidebar;
