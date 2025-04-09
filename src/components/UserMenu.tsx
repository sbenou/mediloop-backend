
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useRef, useState, memo } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenuItems } from "./user-menu/UserMenuItems";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserSession } from "@/hooks/user/useUserSession";
import { useAvatarUpload } from "@/hooks/user/useAvatarUpload";
import UserMenuAvatar from "./user-menu/UserMenuAvatar";
import UserMenuTrigger from "./user-menu/UserMenuTrigger";
import LoginButton from "./user-menu/LoginButton";

const UserMenu = () => {
  const { isAuthenticated, isLoading, profile, userRole } = useAuth();
  const { localLoading, hasVisibleSession } = useUserSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, handleFileChange } = useAvatarUpload(profile);
  
  // Format role for display - capitalize first letter
  const formattedRole = userRole ? 
    userRole.charAt(0).toUpperCase() + userRole.slice(1) : 
    'User';

  const handleNavigateToSettings = () => {
    navigate('/settings?tab=profile');
    setMenuOpen(false);
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    await handleFileChange(file);
  };

  const shouldShowSkeleton = isLoading && localLoading && !hasVisibleSession;

  if (shouldShowSkeleton) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading && !localLoading && !hasVisibleSession) {
    return <LoginButton />;
  }

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <div className="flex items-center space-x-2">
        <UserMenuAvatar 
          profile={profile} 
          avatarUrl={avatarUrl} 
          onAvatarClick={handleAvatarClick} 
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileInputChange}
        />
        <DropdownMenuTrigger asChild>
          <UserMenuTrigger profile={profile} formattedRole={formattedRole} />
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent 
        align="end" 
        sideOffset={5}
        className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedUserMenu = memo(UserMenu);
MemoizedUserMenu.displayName = 'UserMenu';

export default MemoizedUserMenu;
