
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import SidebarBrand from "./SidebarBrand";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { PharmacistNavigation } from "./pharmacy/PharmacistNavigation";
import { usePharmacyNavigation } from "./pharmacy/usePharmacyNavigation";

interface PharmacistSidebarProps {
  canViewProducts?: boolean;
  canEditProducts?: boolean;
  canManageStaff?: boolean;
  canManagePrescriptions?: boolean;
  canViewPrescriptions?: boolean;
}

const PharmacistSidebar = ({
  canViewProducts = false,
  canEditProducts = false,
  canManageStaff = false,
  canManagePrescriptions = false,
  canViewPrescriptions = false
}: PharmacistSidebarProps) => {
  const { profile } = useAuth();
  const { handleLogout } = useSidebarLogout();
  const {
    navigateToPharmacySection,
    navigateToPharmacyProfile,
    navigateToProducts
  } = usePharmacyNavigation();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        {/* Consistent "Platform" header for top navigation */}
        <SidebarSection title="Platform">
          <PharmacistNavigation
            canViewProducts={canViewProducts}
            canViewPrescriptions={canViewPrescriptions}
            navigateToPharmacySection={navigateToPharmacySection}
            navigateToProducts={navigateToProducts}
          />
        </SidebarSection>
        {/* Consistency: Add Admin section header, even if empty */}
        <div className="mt-8" />
        <SidebarSection title="Admin">
          <div></div>
        </SidebarSection>
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole="pharmacist"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={() => navigateToPharmacySection('profile', 'personal', 'profileTab')}
        navigateToBilling={() => navigateToPharmacySection('orders', 'payments', 'ordersTab')}
        navigateToUpgrade={() => navigateToPharmacySection('/upgrade')}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default PharmacistSidebar;

