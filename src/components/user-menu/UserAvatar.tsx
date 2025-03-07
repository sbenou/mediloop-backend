
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export interface UserAvatarProps {
  userProfile: UserProfile | null;
  canUpload?: boolean;
  squared?: boolean;
  onAvatarClick?: () => void;
}

const UserAvatar = ({ 
  userProfile, 
  canUpload = false, 
  squared = false,
  onAvatarClick
}: UserAvatarProps) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Generate initials from the name
  const getInitials = () => {
    if (!userProfile?.full_name) return "U";
    
    const names = userProfile.full_name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };
  
  const handleAvatarClick = (e: React.MouseEvent) => {
    if (onAvatarClick) {
      e.stopPropagation(); // Prevent event bubbling
      onAvatarClick();
    }
  };
  
  return (
    <Avatar 
      className={`h-10 w-10 ${squared ? 'rounded-md' : 'rounded-full'} relative bg-muted`}
      onClick={handleAvatarClick}
    >
      {isLoading && <Skeleton className="h-full w-full absolute inset-0" />}
      
      <AvatarImage
        src={userProfile?.avatar_url || ""}
        alt={userProfile?.full_name || "User"}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        className="object-cover"
      />
      
      {!isLoading && (
        <AvatarFallback className={`text-primary bg-primary/10 ${squared ? 'rounded-md' : 'rounded-full'}`}>
          {getInitials()}
        </AvatarFallback>
      )}
      
      {canUpload && (
        <div className="absolute bottom-0 right-0 h-3 w-3 bg-primary rounded-full border-2 border-white" />
      )}
    </Avatar>
  );
};

export default UserAvatar;
