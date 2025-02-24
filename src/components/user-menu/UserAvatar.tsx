
import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { UserProfile } from "@/types/user";

interface UserAvatarProps {
  userProfile?: UserProfile | null;
}

const UserAvatar = memo(({ userProfile }: UserAvatarProps) => {
  return (
    <Avatar className="h-10 w-10">
      <AvatarImage 
        src={userProfile?.avatar_url || ''} 
        alt={userProfile?.full_name || 'Profile'} 
      />
      <AvatarFallback className="bg-[#7E69AB]/10">
        <User className="h-5 w-5 text-[#7E69AB]" />
      </AvatarFallback>
    </Avatar>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the avatar_url or full_name changed
  return (
    prevProps.userProfile?.avatar_url === nextProps.userProfile?.avatar_url &&
    prevProps.userProfile?.full_name === nextProps.userProfile?.full_name
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
