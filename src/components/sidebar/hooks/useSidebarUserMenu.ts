
import { RefObject } from 'react';
import { usePharmacyData } from '@/hooks/sidebar/usePharmacyData';
import { useSidebarUserProfile } from './useSidebarUserProfile';
import { useSidebarLogout } from './useSidebarLogout';
import { UserProfile } from '@/types/user';

export const useSidebarUserMenu = (
  profile: UserProfile | null,
  userRole: string
) => {
  const {
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange
  } = useSidebarUserProfile(profile);
  
  const { handleLogout } = useSidebarLogout();
  
  const { pharmacyName } = usePharmacyData(profile, userRole);
  
  return {
    pharmacyName,
    fileInputRef,
    getUserInitials,
    handleAvatarClick,
    handleFileChange,
    handleLogout
  };
};
