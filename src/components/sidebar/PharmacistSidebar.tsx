
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarBrand from "./SidebarBrand";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import PharmacistNavigation from "./pharmacy/PharmacistNavigation";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

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
  canViewPrescriptions = true
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
  
  // Direct navigation functions
  const navigateToPharmacyProfile = () => {
    navigate('/pharmacy/profile', { 
      state: { preserveAuth: true },
      replace: false 
    });
  };

  const navigateToPharmacyDashboard = () => {
    navigate(getDashboardRouteByRole("pharmacist"), {
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

  const navigateToReferral = () => {
    navigate("/referral", {
      state: { preserveAuth: true },
      replace: false,
    });
  };

  /** Same destination as “Pharmacy profile”; fills the generic “Profile” slot in the user menu. */
  const navigateToProfile = navigateToPharmacyProfile;
  
  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <PharmacistNavigation 
          canViewProducts={canViewProducts}
          canEditProducts={canEditProducts}
          canManagePrescriptions={canManagePrescriptions}
          canViewPrescriptions={true}
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
        navigateToProfile={navigateToProfile}
        navigateToAccount={navigateToAccount}
        navigateToPharmacyDashboard={navigateToPharmacyDashboard}
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
        navigateToReferral={navigateToReferral}
      />
    </aside>
  );
};

export default PharmacistSidebar;
