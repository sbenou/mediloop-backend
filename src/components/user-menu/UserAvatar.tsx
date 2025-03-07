
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";

interface UserAvatarProps {
  userProfile: UserProfile | null;
  canUpload?: boolean;
  onAvatarClick?: (e: React.MouseEvent) => void;
  fallbackText?: string;
}

const UserAvatar = ({ userProfile, canUpload = false, onAvatarClick, fallbackText }: UserAvatarProps) => {
  // Get the initials if no fallbackText is provided
  const getInitials = () => {
    if (fallbackText) return fallbackText;
    
    if (!userProfile?.full_name) return '';
    
    const names = userProfile.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Avatar 
      className={`h-10 w-10 ${canUpload ? 'cursor-pointer' : ''}`} 
      onClick={canUpload && onAvatarClick ? onAvatarClick : undefined}
    >
      <AvatarImage 
        src={userProfile?.avatar_url || undefined} 
        alt={userProfile?.full_name || 'User'} 
      />
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
