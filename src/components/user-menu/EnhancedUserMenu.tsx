
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import UserMenuItems from "./UserMenuItems";

const EnhancedUserMenu = () => {
  const { profile, user } = useAuth();

  if (!user || !profile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center space-x-2">
          <UserAvatar userProfile={profile} />
          <span>{profile.full_name}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <UserMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnhancedUserMenu;
