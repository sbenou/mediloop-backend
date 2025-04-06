
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
  
  // Log relevant state for debugging
  if (userProfile?.role === 'pharmacist') {
    console.log("UserAvatar: Pharmacy user detected");
    console.log("UserAvatar: pharmacyLogoUrl from Recoil =", pharmacyLogoUrl);
    console.log("UserAvatar: pharmacy_logo_url from profile =", userProfile?.pharmacy_logo_url);
  }
  
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
  
  // If we're in a sidebar menu (isSquare=true) and have a specific role
  if (isSquare && userProfile?.role) {
    if (userProfile.role === 'pharmacist') {
      // For pharmacists, prioritize Recoil state, then profile.pharmacy_logo_url
      displayAvatarUrl = pharmacyLogoUrl || userProfile.pharmacy_logo_url || displayAvatarUrl;
    } else if (userProfile.role === 'doctor') {
      // For doctors, prioritize stamp image
      displayAvatarUrl = doctorStampUrl || displayAvatarUrl;
    } else if (globalAvatarUrl) {
      // For regular users, use global avatar if available
      displayAvatarUrl = globalAvatarUrl;
    }
  } 
  // For non-squared (regular) avatars, use the standard user avatar
  else if (!isSquare && globalAvatarUrl) {
    displayAvatarUrl = globalAvatarUrl;
  }

  // Add timestamp to prevent caching if URL exists
  if (displayAvatarUrl) {
    const hasQueryParams = displayAvatarUrl.includes('?');
    displayAvatarUrl = `${displayAvatarUrl}${hasQueryParams ? '&' : '?'}t=${Date.now()}`;
  }

  return (
    <Avatar className={avatarClass} onClick={handleClick}>
      <AvatarImage 
        src={displayAvatarUrl || undefined} 
        alt={userProfile?.full_name || "User"} 
        crossOrigin="anonymous"
      />
      <AvatarFallback className={isSquare ? "rounded-md" : "rounded-full"}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
