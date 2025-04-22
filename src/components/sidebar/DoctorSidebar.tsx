
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

  // For profile dropdown at bottom
  const navigateToDoctorProfile = () => {
    console.log('Navigating to doctor profile');
    navigate('/doctor/profile');
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade');
  };

  // Mimic previous sidebar dropdown - billing, profile, etc. 
  const navigateToProfile = () => {
    navigate(`/dashboard?view=doctor&section=profile&profileTab=personal`);
  };

  const navigateToBilling = () => {
    navigate('/billing-details');
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      <div className="flex-1 overflow-auto py-4">
        <DoctorPlatformSection
          canPrescribe={canPrescribe}
          canViewPrescriptions={canViewPrescriptions}
        />
        <div className="mt-4" /> {/* Reduced margin to make spacing consistent */}
        <DoctorAdminSection />
      </div>
      <SidebarUserMenu
        profile={profile}
        userRole="doctor"
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToProfile={navigateToProfile}
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
        navigateToDoctorProfile={navigateToDoctorProfile}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default DoctorSidebar;

