
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { UserProfile } from "@/types/user";

interface UserAvatarProps {
  userProfile?: UserProfile | null;
}

const UserAvatar = ({ userProfile }: UserAvatarProps) => {
  return (
    <Avatar className="h-10 w-10 cursor-pointer">
      {userProfile?.avatar_url ? (
        <AvatarImage 
          src={userProfile.avatar_url} 
          alt={userProfile.full_name || 'Profile'} 
        />
      ) : null}
      <AvatarFallback className="bg-[#7E69AB]/10">
        <User className="h-5 w-5 text-[#7E69AB]" />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
