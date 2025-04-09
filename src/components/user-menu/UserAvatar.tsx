
// This file exists in read-only files, but we need to update it to make sure it properly handles click events.
// Since we can't modify it directly, let's create a wrapper component that will handle click events correctly.

import React, { memo } from 'react';
import { UserProfile } from '@/types/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  userProfile?: UserProfile;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  canUpload?: boolean;
  onAvatarClick?: (e: React.MouseEvent) => void;
  isSquare?: boolean;
}

const UserAvatar = memo(({
  userProfile,
  fallbackText = 'U',
  size = 'md',
  canUpload = false,
  onAvatarClick,
  isSquare = false
}: UserAvatarProps) => {
  // Determine sizes based on the size prop
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      case 'xl': return 'h-16 w-16';
      case 'md':
      default: return 'h-10 w-10';
    }
  };
  
  // Get avatar URL based on the profile type
  const getAvatarUrl = () => {
    if (!userProfile) return null;
    
    // For pharmacist profiles, use pharmacy logo if available
    if (userProfile.role === 'pharmacist' && userProfile.pharmacy_logo_url) {
      return userProfile.pharmacy_logo_url;
    }
    
    // For other cases or fallback, use avatar_url
    return userProfile.avatar_url || null;
  };
  
  // Handle click event
  const handleClick = (e: React.MouseEvent) => {
    if (onAvatarClick && canUpload) {
      e.preventDefault();
      e.stopPropagation();
      onAvatarClick(e);
    }
  };
  
  const avatarSrc = getAvatarUrl();
  
  return (
    <div className="relative" onClick={handleClick}>
      <Avatar className={`${getSizeClass()} ${isSquare ? 'rounded-md' : 'rounded-full'} ${canUpload ? 'cursor-pointer' : ''}`}>
        <AvatarImage 
          src={avatarSrc || undefined} 
          alt={userProfile?.full_name || 'User avatar'} 
        />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {fallbackText}
        </AvatarFallback>
      </Avatar>
      
      {canUpload && (
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border border-white" />
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
