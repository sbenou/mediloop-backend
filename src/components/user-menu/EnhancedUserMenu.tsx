
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { UserMenuItems } from "./UserMenuItems";

const EnhancedUserMenu = () => {
  const { profile, user, userRole } = useAuth();

  if (!user || !profile) {
    return null;
  }

  // Format role for display - capitalize first letter
  const formattedRole = userRole ? 
    userRole.charAt(0).toUpperCase() + userRole.slice(1) : 
    'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center space-x-2 px-2">
          <UserAvatar userProfile={profile} />
          <div className="flex flex-col items-start">
            <span className="hidden md:inline-block font-medium">{profile.full_name}</span>
            <span className="hidden md:inline-block text-xs text-muted-foreground">{formattedRole}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedUserMenu;
