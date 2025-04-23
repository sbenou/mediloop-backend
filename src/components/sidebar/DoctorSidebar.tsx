import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import SidebarBrand from "./SidebarBrand";
import SidebarUserMenu from "./SidebarUserMenu";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import DoctorPlatformSection from "./doctor/DoctorPlatformSection";
import DoctorAdminSection from "./doctor/DoctorAdminSection";

interface DoctorSidebarProps {
  canPrescribe?: boolean;
  canManageStaff?: boolean;
  canViewPrescriptions?: boolean;
}

const DoctorSidebar = ({
  canPrescribe = false,
  canManageStaff = false,
  canViewPrescriptions = false
}: DoctorSidebarProps) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { handleLogout } = useSidebarLogout();

  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  // Add navigation handlers for billing and upgrade
  const navigateToBilling = () => {
    navigate('/billing-details');
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade');
  };

  // Add Doctor Profile navigation handler
  const navigateToDoctorProfile = () => {
    navigate('/doctor/profile');
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      <div className="flex-1 overflow-auto py-4">
        <DoctorPlatformSection
          canPrescribe={canPrescribe}
          canViewPrescriptions={canViewPrescriptions}
        />
        <div className="mt-4" />
        <DoctorAdminSection />
      </div>
      <SidebarUserMenu
        profile={profile}
        userRole="doctor"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        handleFileChange={handleFileChange}
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
        navigateToDoctorProfile={navigateToDoctorProfile}
      />
    </aside>
  );
};

export default DoctorSidebar;
