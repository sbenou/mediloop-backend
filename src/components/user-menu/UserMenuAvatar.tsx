
import { useRef } from 'react';
import UserAvatar from "./UserAvatar";
import { UserProfile } from "@/types/user";

interface UserMenuAvatarProps {
  profile: UserProfile | null;
  avatarUrl: string | null;
  onAvatarClick: () => void;
}

const UserMenuAvatar = ({ profile, avatarUrl, onAvatarClick }: UserMenuAvatarProps) => {
  return (
    <div onClick={onAvatarClick} className="cursor-pointer">
      <UserAvatar 
        userProfile={profile ? {
          ...profile,
          avatar_url: avatarUrl || profile.avatar_url
        } : undefined} 
        canUpload={true} 
        onAvatarClick={(e) => {
          e.stopPropagation();
          onAvatarClick();
        }}
      />
    </div>
  );
};

export default UserMenuAvatar;
