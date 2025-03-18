
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";
import { cn } from "@/lib/utils";
import { useRecoilValue } from "recoil";
import { userAvatarState } from "@/store/user/atoms";
import { useAuth } from "@/hooks/auth/useAuth";

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
  const globalAvatarUrl = useRecoilValue(userAvatarState);
  const { profile } = useAuth();
  
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

  // Check if this is the current user's avatar
  const isCurrentUser = userProfile?.id && profile?.id && userProfile.id === profile.id;
  
  // Use global avatar URL from Recoil if we're displaying the current user's avatar
  const avatarUrl = isCurrentUser && globalAvatarUrl
    ? globalAvatarUrl
    : userProfile?.avatar_url;

  return (
    <Avatar className={avatarClass} onClick={handleClick}>
      <AvatarImage 
        src={avatarUrl || undefined} 
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
