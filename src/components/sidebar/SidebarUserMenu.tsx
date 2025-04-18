
import { UserProfile } from "@/types/user";
import { ChevronDown } from "lucide-react";
import UserAvatar from "../user-menu/UserAvatar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RefObject } from "react";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { doctorStampUrlState, pharmacyLogoUrlState } from "@/store/images/atoms";
import { useNavigate } from "react-router-dom";
import { UserMenuContent } from "./menu/UserMenuContent";
import { usePharmacyData } from "@/hooks/pharmacy/usePharmacyData";
import { useDoctorAvailability } from "@/hooks/doctor/useDoctorAvailability";

interface SidebarUserMenuProps {
  profile: UserProfile | null;
  userRole: string;
  fileInputRef: RefObject<HTMLInputElement>;
  handleAvatarClick: (e: React.MouseEvent) => void;
  getUserInitials: () => string;
  handleLogout: () => Promise<void>;
  navigateToAccount: () => void;
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
  navigateToAccount,
  navigateToBilling,
  navigateToUpgrade,
  navigateToPharmacyProfile,
  navigateToDoctorProfile,
  handleFileChange
}: SidebarUserMenuProps) => {
  const navigate = useNavigate();
  const userAvatar = useRecoilValue(userAvatarState);
  const doctorStampUrl = useRecoilValue(doctorStampUrlState);
  const pharmacyLogoUrl = useRecoilValue(pharmacyLogoUrlState);
  
  const { pharmacyName, isAvailable: isPharmacyAvailable } = usePharmacyData(profile);
  const { isAvailable: isDoctorAvailable } = useDoctorAvailability(profile);
  
  // Determine which avatar URL to use based on user role and context
  const getAvatarUrl = () => {
    if (userRole === 'pharmacist') {
      return pharmacyLogoUrl || profile?.pharmacy_logo_url || null;
    } else if (userRole === 'doctor') {
      return doctorStampUrl || profile?.doctor_stamp_url || null;
    } else {
      return userAvatar || profile?.avatar_url || null;
    }
  };
  
  // Determine display name based on user role
  const displayName = userRole === 'pharmacist' 
    ? pharmacyName || profile?.pharmacy_name || 'Pharmacy'
    : profile?.full_name || 'User';
  
  // Determine email or secondary text
  const secondaryText = userRole === 'pharmacist'
    ? 'Pharmacy Account'
    : profile?.email || 'user@example.com';

  return (
    <div className="border-t p-4">
      <div className="flex items-center space-x-3">
        <div 
          onClick={handleAvatarClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          data-testid="sidebar-avatar-container"
        >
          <UserAvatar 
            userProfile={profile ? {
              ...profile,
              pharmacy_name: pharmacyName || profile.pharmacy_name,
              pharmacy_logo_url: getAvatarUrl() || undefined
            } : undefined} 
            canUpload={true}
            onAvatarClick={(e) => {
              e.stopPropagation();
              handleAvatarClick(e);
            }}
            fallbackText={getUserInitials()} 
            isSquare={true}
            isAvailable={userRole === 'pharmacist' ? isPharmacyAvailable : isDoctorAvailable}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="overflow-hidden flex-1 flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{secondaryText}</p>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
            </div>
          </DropdownMenuTrigger>
          
          <UserMenuContent
            userRole={userRole}
            profile={profile}
            navigateToAccount={navigateToAccount}
            navigateToBilling={navigateToBilling}
            navigateToUpgrade={navigateToUpgrade}
            navigateToPharmacyProfile={navigateToPharmacyProfile}
            navigateToDoctorProfile={navigateToDoctorProfile}
            handleLogout={handleLogout}
          />
        </DropdownMenu>
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
