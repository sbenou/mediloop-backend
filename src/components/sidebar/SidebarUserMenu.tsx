
import { UserProfile } from "@/types/user";
import { ChevronDown, CreditCard, LogOut, User } from "lucide-react";
import UserAvatar from "../user-menu/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefObject } from "react";

interface SidebarUserMenuProps {
  profile: UserProfile | null;
  userRole: string;
  fileInputRef: RefObject<HTMLInputElement>;
  handleAvatarClick: (e: React.MouseEvent) => void;
  getUserInitials: () => string;
  handleLogout: () => Promise<void>;
  navigateToProfile: () => void;
  navigateToBilling: () => void;
  navigateToUpgrade: () => void;
}

const SidebarUserMenu = ({
  profile,
  userRole,
  fileInputRef,
  handleAvatarClick,
  getUserInitials,
  handleLogout,
  navigateToProfile,
  navigateToBilling,
  navigateToUpgrade
}: SidebarUserMenuProps) => {
  return (
    <div className="border-t p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded-md transition-colors">
            <div>
              <UserAvatar 
                userProfile={profile} 
                canUpload={true} 
                onAvatarClick={handleAvatarClick} 
                fallbackText={getUserInitials()} 
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  // Handle file change
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  console.log("Avatar file selected:", file.name);
                }}
              />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email || 'user@example.com'}</p>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" side="right" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1 items-center">
              <p className="text-sm font-normal">{profile?.email || 'user@example.com'}</p>
              <p className="text-xs font-medium">{userRole === 'user' ? 'Patient' : userRole}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={navigateToUpgrade}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Upgrade to Pro</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={navigateToProfile}>
              <User className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={navigateToBilling}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarUserMenu;
