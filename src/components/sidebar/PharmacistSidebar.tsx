
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Share } from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarItem from "./SidebarItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import PharmacistNavigation from "./pharmacy/PharmacistNavigation";
import { usePharmacyNavigation } from "./pharmacy/usePharmacyNavigation";

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
    navigateToDashboard,
    navigateToPharmacyProfile
  } = usePharmacyNavigation();
  
  const { 
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  // Add navigation handlers for billing and upgrade
  const navigateToBilling = () => {
    navigate('/billing-details');
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade');
  };
  
  // Navigate to settings
  const navigateToSettings = () => {
    navigate('/settings');
  };
  
  // Navigate to referral
  const navigateToReferral = () => {
    navigate('/referral');
  };
  
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
        
        <div className="px-3 mt-4">
          {/* Add Referral Link */}
          <SidebarItem
            icon={<Share className="w-5 h-5 mr-4" />}
            label="Referral"
            isActive={location.pathname === "/referral"}
            onClick={navigateToReferral}
          />
        </div>
        
        <div className="mt-8" />
        
        {/* Admin Section */}
        {canManageStaff && (
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-4" />}
            label="Staff Management"
            isActive={location.pathname.includes('/staff-management')}
            onClick={() => navigate('/staff-management')}
          />
        )}
        <SidebarItem
          icon={<Settings className="w-5 h-5 mr-4" />}
          label="Settings"
          isActive={location.pathname === '/settings'}
          onClick={navigateToSettings}
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
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
      />
    </aside>
  );
};

export default PharmacistSidebar;
