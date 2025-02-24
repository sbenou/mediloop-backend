
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "./user-menu/UserAvatar";
import { UserMenuItems } from "./user-menu/UserMenuItems";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback, memo } from 'react';

const UserMenu = memo(() => {
  const { isAuthenticated, isLoading, profile, user } = useAuth();
  const navigate = useNavigate();

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  // Show skeleton loader while checking initial auth state
  if (user && isLoading) {
    return (
      <div className="h-10 w-10">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  // Show skeleton while loading and no user data
  if (isLoading && !user) {
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  // Show login button if not authenticated and not loading
  if (!isAuthenticated && !isLoading) {
    return (
      <button
        onClick={handleNavigateToLogin}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  // Show user menu if authenticated
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button"
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer outline-none"
          aria-label="User menu"
        >
          <UserAvatar userProfile={profile} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={5}
        className="z-[9999] w-56 bg-white border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95"
      >
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

UserMenu.displayName = 'UserMenu';

export default UserMenu;
