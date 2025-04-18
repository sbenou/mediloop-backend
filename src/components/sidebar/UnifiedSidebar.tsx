
import { useAuth } from "@/hooks/auth/useAuth";
import SidebarUserMenu from "./SidebarUserMenu";
import { PlatformSection } from "./sections/PlatformSection";
import { AdminSection } from "./sections/AdminSection";
import { useSidebarLogout } from "./hooks/useSidebarLogout";
import { useSidebarUserProfile } from "./hooks/useSidebarUserProfile";
import { useNavigate } from "react-router-dom";

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

  const navigateToPharmacyProfile = () => {
    console.log('Navigating to pharmacy profile from UnifiedSidebar');
    navigate('/pharmacy/profile');
  };
  
  const navigateToDoctorProfile = () => {
    console.log('Navigating to doctor profile from UnifiedSidebar');
    navigate('/doctor/profile');
  };
  
  const navigateToAccount = () => {
    console.log('Navigating to Account page from sidebar menu');
    navigate('/account');
  };

  return (
    <aside className="w-64 border-r bg-white min-h-screen flex flex-col sticky top-0 h-screen overflow-hidden">
      <div className="flex-1 overflow-auto py-4">
        <PlatformSection />
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
        navigateToBilling={() => navigate('/dashboard?view=orders&ordersTab=payments')}
        navigateToUpgrade={() => navigate('/upgrade')}
        navigateToPharmacyProfile={userRole === 'pharmacist' ? navigateToPharmacyProfile : undefined}
        navigateToDoctorProfile={userRole === 'doctor' ? navigateToDoctorProfile : undefined}
        handleFileChange={handleFileChange}
      />
    </aside>
  );
};

export default UnifiedSidebar;
