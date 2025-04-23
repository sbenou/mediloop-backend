
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { doctorStampUrlState, pharmacyLogoUrlState } from "@/store/images/atoms";
import { CircleDot } from "lucide-react";
import { useMemo } from "react";

export interface UserAvatarProps {
  userProfile?: UserProfile;
  fallbackText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  canUpload?: boolean;
  onAvatarClick?: (e: React.MouseEvent) => void;
  isSquare?: boolean;
  showStatus?: boolean;
  isAvailable?: boolean;
}

const UserAvatar = ({ 
  userProfile, 
  fallbackText, 
  size = "md", 
  canUpload = false,
  onAvatarClick,
  isSquare = false,
  showStatus = true,
  isAvailable = true
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
  
  // Generate initials - use pharmacy name for pharmacists if available
  const initials = useMemo(() => {
    if (fallbackText) return fallbackText;
    
    if (userProfile?.role === 'pharmacist' && userProfile?.pharmacy_name) {
      const pharmacyNames = userProfile.pharmacy_name.split(' ');
      if (pharmacyNames.length === 1) return pharmacyNames[0].charAt(0).toUpperCase();
      return (pharmacyNames[0].charAt(0) + pharmacyNames[pharmacyNames.length - 1].charAt(0)).toUpperCase().substring(0, 2);
    }
    
    if (!userProfile?.full_name) return 'U';
    const names = userProfile.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase().substring(0, 2);
  }, [fallbackText, userProfile?.full_name, userProfile?.pharmacy_name, userProfile?.role]);

  const handleClick = (e: React.MouseEvent) => {
    if (canUpload && onAvatarClick) {
      e.preventDefault();
      e.stopPropagation();
      onAvatarClick(e);
    }
  };

  // Determine which avatar URL to use based on user role and context - memoize to prevent re-renders
  const displayAvatarUrl = useMemo(() => {
    let url = null;
    
    // For patients, always use the user avatar
    if (userProfile?.role === 'patient' || userProfile?.role === 'user') {
      url = globalAvatarUrl || userProfile?.avatar_url;
    }
    // Special handling for pharmacists in sidebar (isSquare=true)
    else if (userProfile?.role === 'pharmacist' && isSquare) {
      // For pharmacists in sidebar, ONLY use pharmacy logo or nothing
      url = pharmacyLogoUrl || userProfile.pharmacy_logo_url;
    }
    // For doctors in sidebar
    else if (userProfile?.role === 'doctor' && isSquare) {
      url = doctorStampUrl || userProfile.doctor_stamp_url;
    }
    // For regular users or non-sidebar contexts
    else if (!isSquare) {
      url = globalAvatarUrl || userProfile?.avatar_url;
    }

    // Don't add timestamp to prevent unnecessary re-rendering
    return url;
  }, [
    userProfile?.role, 
    userProfile?.avatar_url,
    userProfile?.doctor_stamp_url,
    userProfile?.pharmacy_logo_url,
    globalAvatarUrl,
    doctorStampUrl,
    pharmacyLogoUrl,
    isSquare
  ]);

  // Determine status indicator size based on avatar size
  const statusSize = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
    xl: "h-5 w-5"
  };

  return (
    <div className="relative" data-testid="avatar-container">
      <Avatar 
        className={avatarClass} 
        onClick={handleClick}
        data-testid="user-avatar"
      >
        <AvatarImage 
          src={displayAvatarUrl || undefined} 
          alt={userProfile?.role === 'pharmacist' ? userProfile?.pharmacy_name || "Pharmacy" : userProfile?.full_name || "User"} 
          crossOrigin="anonymous"
        />
        <AvatarFallback className={isSquare ? "rounded-md" : "rounded-full"}>
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Status indicator */}
      {showStatus && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            statusSize[size],
            isAvailable ? "bg-green-500" : "bg-gray-400"
          )}
          data-testid="status-indicator"
        />
      )}
    </div>
  );
};

export default UserAvatar;
