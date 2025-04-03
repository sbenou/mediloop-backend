
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
  const { profile, user } = useAuth();

  if (!user || !profile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center space-x-2 px-2">
          <UserAvatar userProfile={profile} />
          <span className="hidden md:inline-block">{profile.full_name}</span>
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
