
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import SidebarBrand from "./SidebarBrand";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { PharmacistNavigation } from "./pharmacy/PharmacistNavigation";
import { usePharmacyNavigation } from "./pharmacy/usePharmacyNavigation";
import SidebarSection from "./SidebarSection";

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
  const navigate = useNavigate(); // Initialize useNavigate
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
        {/* Consistency: Add Admin section header with Settings */}
        <div className="mt-8" />
        <SidebarSection title="Admin">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => navigateToPharmacySection('settings')}
              className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Settings
            </button>
          </div>
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
        navigateToBilling={() => navigate('/billing-details')} 
        navigateToUpgrade={() => navigateToPharmacySection('/upgrade')}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default PharmacistSidebar;
