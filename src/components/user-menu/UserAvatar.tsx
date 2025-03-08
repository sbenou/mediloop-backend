
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProfile } from "@/types/user";

interface UserAvatarProps {
  userProfile: UserProfile | null;
  canUpload?: boolean;
  onAvatarClick?: (e: React.MouseEvent) => void;
  fallbackText?: string;
  isSquare?: boolean;
}

const UserAvatar = ({ 
  userProfile, 
  canUpload = false, 
  onAvatarClick, 
  fallbackText,
  isSquare = false
}: UserAvatarProps) => {
  // Get the initials if no fallbackText is provided
  const getInitials = () => {
    if (fallbackText) return fallbackText;
    
    // For pharmacists, use pharmacy name initials if available
    if (userProfile?.role === 'pharmacist') {
      const pharmacyName = userProfile?.pharmacy_name || '';
      if (pharmacyName) {
        const names = pharmacyName.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
      }
    }
    
    // Default to user's name initials
    if (!userProfile?.full_name) return '';
    
    const names = userProfile.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <Avatar 
      className={`h-10 w-10 ${isSquare ? 'rounded-md' : 'rounded-full'} ${canUpload ? 'cursor-pointer' : ''}`} 
      onClick={canUpload && onAvatarClick ? onAvatarClick : undefined}
    >
      <AvatarImage 
        src={userProfile?.role === 'pharmacist' ? userProfile?.pharmacy_logo_url : userProfile?.avatar_url} 
        alt={userProfile?.role === 'pharmacist' ? userProfile?.pharmacy_name || 'Pharmacy' : userProfile?.full_name || 'User'} 
        className={isSquare ? 'rounded-md' : 'rounded-full'}
      />
      <AvatarFallback className={`bg-primary/10 text-primary font-medium ${isSquare ? 'rounded-md' : 'rounded-full'}`}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
