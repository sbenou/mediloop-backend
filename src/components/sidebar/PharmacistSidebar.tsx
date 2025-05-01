
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Settings, ShoppingBag, Users, FileText, 
  Activity, Gift, User, LayoutDashboard
} from "lucide-react";
import SidebarBrand from "./SidebarBrand";
import SidebarItem from "./SidebarItem";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import SidebarSection from "./SidebarSection";

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
  
  // Navigation handlers
  const navigateToDashboard = () => {
    navigate('/pharmacy/dashboard?section=dashboard');
  };
  
  const navigateToPharmacyProfile = () => {
    navigate('/pharmacy/profile');
  };
  
  const navigateToBilling = () => {
    navigate('/billing-details');
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade');
  };
  
  // Standard icon size for consistency
  const iconSize = "w-5 h-5";
  
  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      
      <div className="flex-1 overflow-auto py-4">
        <SidebarSection title="PLATFORM">
          <SidebarItem
            icon={<LayoutDashboard className={`${iconSize} mr-4`} />}
            label="Dashboard"
            isActive={location.pathname.includes('/pharmacy/dashboard')}
            onClick={navigateToDashboard}
          />
          
          <SidebarItem
            icon={<ShoppingBag className={`${iconSize} mr-4`} />}
            label="Orders"
            isActive={location.search.includes('section=orders')}
            onClick={() => navigate('/pharmacy/dashboard?section=orders')}
          />
          
          <SidebarItem
            icon={<Users className={`${iconSize} mr-4`} />}
            label="Patients"
            isActive={location.search.includes('section=patients')}
            onClick={() => navigate('/pharmacy/dashboard?section=patients')}
          />
          
          {canViewPrescriptions && (
            <SidebarItem
              icon={<FileText className={`${iconSize} mr-4`} />}
              label="Prescriptions"
              isActive={location.search.includes('section=prescriptions')}
              onClick={() => navigate('/pharmacy/dashboard?section=prescriptions')}
            />
          )}
          
          <SidebarItem
            icon={<Activity className={`${iconSize} mr-4`} />}
            label="Activity"
            isActive={location.pathname === "/activities"}
            onClick={() => navigate('/activities')}
          />
          
          <SidebarItem
            icon={<Gift className={`${iconSize} mr-4`} />}
            label="Referral"
            isActive={location.pathname === "/referral"}
            onClick={() => navigate('/referral')}
          />
          
          <SidebarItem
            icon={<User className={`${iconSize} mr-4`} />}
            label="Account"
            isActive={location.pathname === "/account"}
            onClick={() => navigate('/account')}
          />
        </SidebarSection>

        <div className="mt-8" />

        <SidebarSection title="ADMIN">
          {canManageStaff && (
            <SidebarItem
              icon={<Settings className={`${iconSize} mr-4`} />}
              label="Staff Management"
              isActive={location.pathname.includes('/staff-management')}
              onClick={() => navigate('/staff-management')}
            />
          )}
          
          <SidebarItem
            icon={<Settings className={`${iconSize} mr-4`} />}
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
        handleFileChange={handleFileChange}
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
        navigateToPharmacyProfile={navigateToPharmacyProfile}
      />
    </aside>
  );
};

export default PharmacistSidebar;
