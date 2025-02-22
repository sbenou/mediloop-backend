
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
import { useRecoilValue } from "recoil";
import { authState } from "@/store/auth/atoms";

const UserMenu = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { profile } = useRecoilValue(authState);
  const navigate = useNavigate();

  if (!isAuthenticated && !isLoading) {
    return (
      <button
        onClick={() => navigate('/login', { replace: true })}
        className="text-primary hover:text-primary/80 transition-colors"
      >
        Connection
      </button>
    );
  }

  if (isLoading) {
    console.log('Auth loading state');
    return (
      <div className="h-10 w-10 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  console.log('Rendering UserMenu with profile:', profile);

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
};

export default UserMenu;
