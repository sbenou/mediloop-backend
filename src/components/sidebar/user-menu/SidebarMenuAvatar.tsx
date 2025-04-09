
import { UserProfile } from "@/types/user";
import UserAvatar from "../../user-menu/UserAvatar";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { doctorStampUrlState, pharmacyLogoUrlState } from "@/store/images/atoms";

interface SidebarMenuAvatarProps {
  profile: UserProfile | null;
  userRole: string;
  handleAvatarClick: (e: React.MouseEvent) => void;
  fallbackText: string;
}

const SidebarMenuAvatar = ({ 
  profile, 
  userRole,
  handleAvatarClick,
  fallbackText,
}: SidebarMenuAvatarProps) => {
  // Get image URLs from Recoil state
  const userAvatar = useRecoilValue(userAvatarState);
  const doctorStampUrl = useRecoilValue(doctorStampUrlState);
  const pharmacyLogoUrl = useRecoilValue(pharmacyLogoUrlState);

  // Determine which avatar URL to use based on user role
  const getAvatarUrl = () => {
    // For pharmacists, prioritize Recoil state, then profile's pharmacy_logo_url
    if (userRole === 'pharmacist') {
      return pharmacyLogoUrl || profile?.pharmacy_logo_url || null;
    } 
    // For doctors, use doctor stamp
    else if (userRole === 'doctor') {
      return doctorStampUrl || null;
    } 
    // For other users, use regular avatar
    else {
      return userAvatar || profile?.avatar_url || null;
    }
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        handleAvatarClick(e);
      }}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    >
      <UserAvatar 
        userProfile={profile ? {
          ...profile,
          pharmacy_name: profile.pharmacy_name,
          pharmacy_logo_url: getAvatarUrl() || undefined
        } : undefined} 
        canUpload={true}
        onAvatarClick={(e) => {
          e.stopPropagation();
          handleAvatarClick(e);
        }}
        fallbackText={fallbackText} 
        isSquare={true} // Make all avatars square in the sidebar
      />
    </div>
  );
};

export default SidebarMenuAvatar;
