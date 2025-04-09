
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";
import { useRecoilValue } from "recoil";
import { memo, useMemo } from "react";
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
  
  // Use useMemo for all derived values to prevent recalculations
  const sizeClasses = useMemo(() => ({
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl"
  }), []);

  const avatarClass = useMemo(() => cn(
    sizeClasses[size] || sizeClasses.md,
    isSquare ? "rounded-md" : "rounded-full",
    canUpload && "cursor-pointer hover:opacity-80 transition-opacity"
  ), [size, isSquare, canUpload, sizeClasses]);
  
  // Generate initials - use pharmacy name for pharmacists if available
  const initials = useMemo(() => {
    return fallbackText || 
      (userProfile?.role === 'pharmacist' && userProfile?.pharmacy_name ? 
        userProfile.pharmacy_name.split(' ')
          .map(name => name[0])
          .join('')
          .toUpperCase()
          .substring(0, 2) :
        userProfile?.full_name ? 
          userProfile.full_name.split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) : 
          "U");
  }, [fallbackText, userProfile]);

  const handleClick = (e: React.MouseEvent) => {
    if (canUpload && onAvatarClick) {
      onAvatarClick(e);
    }
  };

  // Determine which avatar URL to use based on user role and context
  const displayAvatarUrl = useMemo(() => {
    let url = null;
    
    // Special handling for pharmacists in sidebar (isSquare=true)
    if (userProfile?.role === 'pharmacist' && isSquare) {
      // For pharmacists in sidebar, ONLY use pharmacy logo or nothing
      url = pharmacyLogoUrl || userProfile.pharmacy_logo_url;
    }
    // For doctors in sidebar
    else if (userProfile?.role === 'doctor' && isSquare) {
      url = doctorStampUrl || userProfile.doctor_stamp_url;
    }
    // For regular users or non-sidebar contexts
    else if (!isSquare || userProfile?.role === 'user') {
      url = globalAvatarUrl || userProfile?.avatar_url;
    }

    if (!url) return null;
    
    // Use a stable timestamp for each component mount, not on every render
    const staticTimestamp = Date.now();
    const hasQueryParams = url.includes('?');
    return `${url}${hasQueryParams ? '&' : '?'}t=${staticTimestamp}`;
  }, [userProfile, isSquare, pharmacyLogoUrl, doctorStampUrl, globalAvatarUrl]);

  return (
    <Avatar className={avatarClass} onClick={handleClick}>
      <AvatarImage 
        src={displayAvatarUrl || undefined} 
        alt={userProfile?.role === 'pharmacist' ? userProfile?.pharmacy_name || "Pharmacy" : userProfile?.full_name || "User"} 
        crossOrigin="anonymous"
      />
      <AvatarFallback className={isSquare ? "rounded-md" : "rounded-full"}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedUserAvatar = memo(UserAvatar);
MemoizedUserAvatar.displayName = 'UserAvatar';

export default MemoizedUserAvatar;
