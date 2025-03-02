
import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { UserProfile } from "@/types/user";

interface UserAvatarProps {
  userProfile?: UserProfile | null;
  squared?: boolean;
}

const UserAvatar = memo(({ userProfile, squared = false }: UserAvatarProps) => {
  return (
    <Avatar className={`h-10 w-10 cursor-pointer ${squared ? 'rounded-md' : 'rounded-full'}`}>
      <AvatarImage 
        src={userProfile?.avatar_url || ''} 
        alt={userProfile?.full_name || 'Profile'} 
        className={squared ? 'rounded-md' : 'rounded-full'}
      />
      <AvatarFallback className={`bg-[#7E69AB]/10 ${squared ? 'rounded-md' : 'rounded-full'}`}>
        <User className="h-5 w-5 text-[#7E69AB]" />
      </AvatarFallback>
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
