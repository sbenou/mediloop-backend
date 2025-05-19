
import { useAuth } from "@/hooks/auth/useAuth";
import SidebarUserMenu from "./SidebarUserMenu";
import { PlatformSection } from "./sections/PlatformSection";
import { AdminSection } from "./sections/AdminSection";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { useNavigate } from "react-router-dom";
import SidebarBrand from "./SidebarBrand";

const UnifiedSidebar = () => {
  const { userRole, profile } = useAuth();
  const navigate = useNavigate();
  
  const { handleLogout } = useSidebarLogout();
  
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);

  // Navigation handlers
  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile from UnifiedSidebar');
    navigate('/pharmacy/profile');
  };
  
  const navigateToDoctorProfile = () => {
    console.log('Navigating to doctor profile from UnifiedSidebar');
    navigate('/doctor/profile');
  };
  
  const navigateToAccount = () => {
    console.log('Navigating to Account page from sidebar menu with no header');
    navigate('/account', { state: { showHeader: false } });
  };
  
  const navigateToBilling = () => {
    navigate('/dashboard?view=orders&ordersTab=payments');
  };
  
  const navigateToUpgrade = () => {
    navigate('/upgrade');
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <SidebarBrand />
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 mb-2 mt-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">
            Platform
          </p>
        </div>
        <PlatformSection />
        
        <div className="mt-8" />
        
        <AdminSection />
      </div>
      
      <SidebarUserMenu
        profile={profile}
        userRole={userRole}
        fileInputRef={fileInputRef}
        handleAvatarClick={handleAvatarClick}
        getUserInitials={getUserInitials}
        handleLogout={handleLogout}
        navigateToAccount={navigateToAccount}
        navigateToBilling={navigateToBilling}
        navigateToUpgrade={navigateToUpgrade}
        navigateToPharmacyProfile={userRole === 'pharmacist' ? navigateToPharmacyProfile : undefined}
        navigateToDoctorProfile={userRole === 'doctor' ? navigateToDoctorProfile : undefined}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default UnifiedSidebar;
