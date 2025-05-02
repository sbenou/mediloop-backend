
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLocation } from "react-router-dom";
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
  canViewPrescriptions = true
}: PharmacistSidebarProps) => {
  const { profile } = useAuth();
  const location = useLocation();
  
  const { 
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <PharmacistNavigation 
          canViewProducts={canViewProducts}
          canEditProducts={canEditProducts}
          canManagePrescriptions={canManagePrescriptions}
          canViewPrescriptions={canViewPrescriptions}
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
        navigateToPharmacyProfile={() => {
          window.location.href = '/pharmacy/profile';
        }}
      />
    </aside>
  );
};

export default PharmacistSidebar;
