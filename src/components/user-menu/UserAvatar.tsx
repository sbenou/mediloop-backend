
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { doctorStampUrlState, pharmacyLogoUrlState } from "@/store/images/atoms";

export interface UserAvatarProps {
  userProfile?: UserProfile;
  fallbackText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  canUpload?: boolean;
  onAvatarClick?: (e: React.MouseEvent) => void;
  isSquare?: boolean;
}

const UserAvatar = ({ 
  userProfile, 
  fallbackText, 
  size = "md", 
  canUpload = false,
  onAvatarClick,
  isSquare = false
}: UserAvatarProps) => {
  // Get image URLs from Recoil state
  const globalAvatarUrl = useRecoilValue(userAvatarState);
  const doctorStampUrl = useRecoilValue(doctorStampUrlState);
  const pharmacyLogoUrl = useRecoilValue(pharmacyLogoUrlState);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl" // Increased size for xl option (4x larger than md)
  };

  const avatarClass = cn(
    sizeClasses[size] || sizeClasses.md,
    isSquare ? "rounded-md" : "rounded-full",
    canUpload && "cursor-pointer hover:opacity-80 transition-opacity"
  );
  
  const initials = fallbackText || 
    (userProfile?.full_name ? 
      userProfile.full_name.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) : 
      "U");

  const handleClick = (e: React.MouseEvent) => {
    if (canUpload && onAvatarClick) {
      onAvatarClick(e);
    }
  };

  // Determine which avatar URL to use based on user role and context
  let displayAvatarUrl = userProfile?.avatar_url;
  
  // If we're in a sidebar menu and have a specific role
  if (isSquare && userProfile?.role) {
    if (userProfile.role === 'pharmacist' && pharmacyLogoUrl) {
      displayAvatarUrl = pharmacyLogoUrl;
    } else if (userProfile.role === 'doctor' && doctorStampUrl) {
      displayAvatarUrl = doctorStampUrl;
    } else if (globalAvatarUrl) {
      displayAvatarUrl = globalAvatarUrl;
    }
  } 
  // For non-squared (regular) avatars, use the standard user avatar
  else if (!isSquare && globalAvatarUrl && userProfile?.id === globalAvatarUrl.split('/').slice(-2)[0]) {
    displayAvatarUrl = globalAvatarUrl;
  }

  return (
    <Avatar className={avatarClass} onClick={handleClick}>
      <AvatarImage 
        src={displayAvatarUrl || undefined} 
        alt={userProfile?.full_name || "User"} 
      />
      <AvatarFallback className={isSquare ? "rounded-md" : "rounded-full"}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
