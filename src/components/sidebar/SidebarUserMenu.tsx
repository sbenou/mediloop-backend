
import { UserProfile } from "@/types/user";
import { RefObject } from "react";
import { useSidebarUserMenu } from "./hooks/useSidebarUserMenu";
import SidebarMenuAvatar from "./user-menu/SidebarMenuAvatar";
import SidebarMenuDropdown from "./user-menu/SidebarMenuDropdown";
import SidebarMenuTrigger from "./user-menu/SidebarMenuTrigger";

interface SidebarUserMenuProps {
  profile: UserProfile | null;
  userRole: string;
  fileInputRef: RefObject<HTMLInputElement>;
  handleAvatarClick: (e: React.MouseEvent) => void;
  getUserInitials: () => string;
  handleLogout: () => Promise<void>;
  navigateToProfile: () => void;
  navigateToBilling: () => void;
  navigateToUpgrade: () => void;
  navigateToPharmacyProfile?: () => void;
  navigateToDoctorProfile?: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const SidebarUserMenu = ({
  profile,
  userRole,
  fileInputRef,
  handleAvatarClick,
  getUserInitials,
  handleLogout,
  navigateToProfile,
  navigateToBilling,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  navigateToDoctorProfile,
  handleFileChange
}: SidebarUserMenuProps) => {
  const { pharmacyName } = useSidebarUserMenu(profile, userRole);

  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-3">
        {/* Avatar container - completely separated from the dropdown */}
        <SidebarMenuAvatar
          profile={profile}
          userRole={userRole}
          handleAvatarClick={handleAvatarClick}
          fallbackText={getUserInitials()}
        />
        
        {/* Text info container with dropdown trigger */}
        <SidebarMenuDropdown
          triggerElement={
            <SidebarMenuTrigger 
              profile={profile} 
              userRole={userRole}
              pharmacyName={pharmacyName}
            />
          }
          profile={profile}
          userRole={userRole}
          navigateToBilling={navigateToBilling}
          navigateToProfile={navigateToProfile}
          navigateToUpgrade={navigateToUpgrade}
          navigateToPharmacyProfile={navigateToPharmacyProfile}
          navigateToDoctorProfile={navigateToDoctorProfile}
          handleLogout={handleLogout}
        />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default SidebarUserMenu;
