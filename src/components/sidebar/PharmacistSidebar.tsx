
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarBrand from "./SidebarBrand";
import SidebarSection from "./SidebarSection";
import SidebarItem from "./SidebarItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { Settings, Users, Share } from "lucide-react";
import PharmacistNavigation from "./pharmacy/PharmacistNavigation";
import { usePharmacyNavigation } from "./pharmacy/usePharmacyNavigation";

interface PharmacistSidebarProps {
  canViewProducts?: boolean;
  canEditProducts?: boolean;
  canManageStaff?: boolean;
  canManagePrescriptions?: boolean;
  canViewPrescriptions?: boolean;
}

// Update the component to include Referral link in the navigation
const PharmacistSidebar = ({
  canViewProducts = false,
  canEditProducts = false,
  canManageStaff = false,
  canManagePrescriptions = false,
  canViewPrescriptions = false
}: PharmacistSidebarProps) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    isProfileOpen, setIsProfileOpen, 
    isOrdersOpen, setIsOrdersOpen,
    navigateToPharmacySection 
  } = usePharmacyNavigation();
  
  const { 
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  // For profile dropdown at bottom
  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile');
    navigate('/pharmacy/profile');
  };
  
  const navigateToProfile = () => {
    navigateToPharmacySection('profile', 'personal', 'profileTab');
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade');
  };
  
  const navigateToBilling = () => {
    navigate('/billing-details');
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
            icon={<Share className="w-5 h-5 mr-3" />}
            label="Referral"
            isActive={location.pathname === "/referral"}
            onClick={() => navigate('/referral')}
          />
        </div>
        
        <div className="mt-8" />
        
        <SidebarSection title="Admin">
          {canManageStaff && (
            <SidebarItem
              icon={<Users className="w-5 h-5 mr-3" />}
              label="Staff Management"
              isActive={location.pathname.includes('/staff-management')}
              onClick={() => navigate('/staff-management')}
            />
          )}
          <SidebarItem
            icon={<Settings className="w-5 h-5 mr-3" />}
            label="Settings"
            isActive={location.pathname === '/settings'}
            onClick={() => navigate('/settings')}
          />
        </SidebarSection>
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole="pharmacist"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={navigateToProfile}
        navigateToUpgrade={navigateToUpgrade}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
        handleFileChange={handleFileChange}
        navigateToBilling={navigateToBilling}
      />
    </aside>
  );
};

export default PharmacistSidebar;
