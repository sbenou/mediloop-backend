
import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { UserProfile } from "@/types/user";

interface UserAvatarProps {
  userProfile?: UserProfile | null;
}

const UserAvatar = memo(({ userProfile }: UserAvatarProps) => {
  return (
    <Avatar className="h-10 w-10 cursor-pointer">
      <AvatarImage 
        src={userProfile?.avatar_url || ''} 
        alt={userProfile?.full_name || 'Profile'} 
      />
      <AvatarFallback className="bg-[#7E69AB]/10">
        <User className="h-5 w-5 text-[#7E69AB]" />
      </AvatarFallback>
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
