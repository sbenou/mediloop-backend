
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";

export interface UserAvatarProps {
  userProfile: UserProfile;
  fallbackText?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const UserAvatar = ({ userProfile, fallbackText, size = "md" }: UserAvatarProps) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-20 w-20 text-xl"
  };

  const avatarClass = sizeClasses[size] || sizeClasses.md;
  
  const initials = fallbackText || 
    (userProfile.full_name ? 
      userProfile.full_name.split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) : 
      "U");

  return (
    <Avatar className={avatarClass}>
      <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.full_name || "User"} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
